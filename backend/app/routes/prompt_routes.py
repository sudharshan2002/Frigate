"""Routes for prompt generation and what-if analysis."""

from __future__ import annotations

import logging
from time import perf_counter

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import (
    ComparisonDelta,
    GenerateRequest,
    GenerateResponse,
    MetricCreateRequest,
    SessionCreate,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.explanation_service import ExplanationService
from app.services.genai_service import GenAIService
from app.services.metrics_service import MetricsService
from app.services.session_service import SessionService
from app.utils.helpers import (
    estimate_generation_scores,
    quality_label_from_score,
    summarize_prompt_difference,
    tokenize_text,
)

router = APIRouter(tags=["prompt"])
logger = logging.getLogger(__name__)


def _get_genai_service(request: Request) -> GenAIService:
    return request.app.state.genai_service


def _get_explanation_service(request: Request) -> ExplanationService:
    return request.app.state.explanation_service


def _get_metrics_service(request: Request) -> MetricsService:
    return request.app.state.metrics_service


def _get_session_service(request: Request) -> SessionService:
    return request.app.state.session_service


def _build_session_payload(
    *,
    prompt: str,
    output: str,
    mode: str,
    source: str,
    provider: str,
    response_time_ms: float,
    scoring_output: str | None = None,
    difference_summary: str | None = None,
) -> SessionCreate:
    trust_score, clarity_score, quality_score = estimate_generation_scores(
        prompt=prompt,
        output=scoring_output or output,
        mode=mode,
    )
    return SessionCreate(
        prompt=prompt,
        output=output,
        mode=mode,
        source=source,
        provider=provider,
        response_time_ms=response_time_ms,
        token_count=len(tokenize_text(prompt)),
        trust_score=trust_score,
        clarity_score=clarity_score,
        quality_score=quality_score,
        quality_label=quality_label_from_score(quality_score),
        difference_summary=difference_summary,
    )


@router.post("/generate", response_model=GenerateResponse)
async def generate_content(payload: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate text or image-style output from a user prompt."""
    service = _get_genai_service(request)
    explanation_service = _get_explanation_service(request)
    metrics_service = _get_metrics_service(request)
    session_service = _get_session_service(request)
    started_at = perf_counter()

    try:
        if payload.mode == "image":
            provider_result = await service.generate_image(payload.prompt, payload.reference_image)
        else:
            provider_result = await service.generate_text(payload.prompt, payload.reference_image)

        response_time_ms = round((perf_counter() - started_at) * 1000, 2)
        analysis = explanation_service.analyze_prompt(
            prompt=payload.prompt,
            output=provider_result.analysis_text,
            mode=payload.mode,
            reference_image_used=payload.reference_image is not None,
        )
        prompt_for_session = payload.prompt.strip() or "Reference-image-driven generation"
        session_payload = _build_session_payload(
            prompt=prompt_for_session,
            output=provider_result.output,
            mode=payload.mode,
            source=payload.source,
            provider=provider_result.provider,
            response_time_ms=response_time_ms,
            scoring_output=provider_result.analysis_text,
        )
        session = session_service.create_session(session_payload)
        metrics_service.store_metric(
            MetricCreateRequest(
                prompt_length=len(payload.prompt),
                response_time_ms=response_time_ms,
                endpoint="/generate",
                mode=payload.mode,
                trust_score=session.trust_score / 100,
            )
        )

        logger.info(
            "Generated %s output in %.2f ms",
            payload.mode,
            response_time_ms,
        )
        return GenerateResponse(
            output=provider_result.output,
            provider=provider_result.provider,
            tokens=tokenize_text(prompt_for_session),
            mapping=analysis.mapping,
            segments=analysis.segments,
            explanation_summary=analysis.summary,
            reference_image_used=payload.reference_image is not None,
            session=session,
        )
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Generation failed")
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@router.post("/what-if", response_model=WhatIfResponse)
async def what_if_analysis(payload: WhatIfRequest, request: Request) -> WhatIfResponse:
    """Summarize prompt edits and generate the new output for the modified prompt."""
    service = _get_genai_service(request)
    metrics_service = _get_metrics_service(request)
    session_service = _get_session_service(request)

    try:
        original_prompt = payload.original_prompt.strip() or "Reference-image-driven generation"
        modified_prompt = payload.modified_prompt.strip() or "Reference-image-driven generation"
        difference = summarize_prompt_difference(
            original_prompt=payload.original_prompt,
            modified_prompt=payload.modified_prompt,
        )
        if payload.mode == "image":
            original_started_at = perf_counter()
            original_result = await service.generate_image(payload.original_prompt, payload.original_reference_image)
            original_response_time = round((perf_counter() - original_started_at) * 1000, 2)
            modified_started_at = perf_counter()
            modified_result = await service.generate_image(payload.modified_prompt, payload.modified_reference_image)
            modified_response_time = round((perf_counter() - modified_started_at) * 1000, 2)
        else:
            original_started_at = perf_counter()
            original_result = await service.generate_text(payload.original_prompt, payload.original_reference_image)
            original_response_time = round((perf_counter() - original_started_at) * 1000, 2)
            modified_started_at = perf_counter()
            modified_result = await service.generate_text(payload.modified_prompt, payload.modified_reference_image)
            modified_response_time = round((perf_counter() - modified_started_at) * 1000, 2)

        original_analysis = explanation_service.analyze_prompt(
            prompt=payload.original_prompt,
            output=original_result.analysis_text,
            mode=payload.mode,
            reference_image_used=payload.original_reference_image is not None,
        )
        modified_analysis = explanation_service.analyze_prompt(
            prompt=payload.modified_prompt,
            output=modified_result.analysis_text,
            mode=payload.mode,
            reference_image_used=payload.modified_reference_image is not None,
        )

        original_session = session_service.create_session(
            _build_session_payload(
                prompt=original_prompt,
                output=original_result.output,
                mode=payload.mode,
                source="what-if",
                provider=original_result.provider,
                response_time_ms=original_response_time,
                scoring_output=original_result.analysis_text,
                difference_summary=difference,
            )
        )
        modified_session = session_service.create_session(
            _build_session_payload(
                prompt=modified_prompt,
                output=modified_result.output,
                mode=payload.mode,
                source="what-if",
                provider=modified_result.provider,
                response_time_ms=modified_response_time,
                scoring_output=modified_result.analysis_text,
                difference_summary=difference,
            )
        )

        metrics_service.store_metric(
            MetricCreateRequest(
                prompt_length=len(payload.original_prompt),
                response_time_ms=original_response_time,
                endpoint="/what-if",
                mode=payload.mode,
                trust_score=original_session.trust_score / 100,
            )
        )
        metrics_service.store_metric(
            MetricCreateRequest(
                prompt_length=len(payload.modified_prompt),
                response_time_ms=modified_response_time,
                endpoint="/what-if",
                mode=payload.mode,
                trust_score=modified_session.trust_score / 100,
            )
        )

        return WhatIfResponse(
            difference=difference,
            original_session=original_session,
            modified_session=modified_session,
            original_segments=original_analysis.segments,
            modified_segments=modified_analysis.segments,
            original_explanation_summary=original_analysis.summary,
            modified_explanation_summary=modified_analysis.summary,
            segment_changes=explanation_service.compare_segments(
                original_analysis.segments,
                modified_analysis.segments,
            ),
            delta=ComparisonDelta(
                confidence=round(modified_session.trust_score - original_session.trust_score, 2),
                clarity=round(modified_session.clarity_score - original_session.clarity_score, 2),
                quality=round(modified_session.quality_score - original_session.quality_score, 2),
            ),
        )
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("What-if analysis failed")
        raise HTTPException(status_code=500, detail=f"What-if analysis failed: {exc}") from exc

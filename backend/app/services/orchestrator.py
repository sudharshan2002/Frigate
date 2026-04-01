"""Coordinate the main prompt analysis and generation flow."""

from __future__ import annotations

import asyncio
import logging
from time import perf_counter

from app.schemas import (
    GenerateRequest,
    GenerateResponse,
    GeneratedArtifacts,
    MetricCreateRequest,
    SessionCreate,
    WhatIfRequest,
    WhatIfResponse,
    ComparisonDelta,
    AnalyzeRequest,
    AnalyzeResponse,
    PromptExplanationSummary,
)
from app.services.explainer import ExplainabilityService
from app.services.generator import GenerationEngine
from app.services.heatmap_engine import HeatmapEngine
from app.services.metrics_engine import MetricsEngine
from app.services.metrics_service import MetricsService
from app.services.prompt_ml_scorer import PromptMLScorer
from app.services.segmenter import PromptSegmenter
from app.services.session_service import SessionService
from app.services.whatif_engine import WhatIfEngine
from app.utils.helpers import quality_label_from_score, summarize_prompt_difference, tokenize_text

logger = logging.getLogger(__name__)


class XAIOrchestrator:
    """Coordinate segmentation, generation, comparison, and scoring."""

    def __init__(
        self,
        *,
        generator: GenerationEngine,
        segmenter: PromptSegmenter,
        explainer: ExplainabilityService,
        whatif_engine: WhatIfEngine,
        heatmap_engine: HeatmapEngine,
        metrics_engine: MetricsEngine,
        metrics_service: MetricsService,
        session_service: SessionService,
        prompt_ml_scorer: PromptMLScorer,
    ) -> None:
        self.generator = generator
        self.segmenter = segmenter
        self.explainer = explainer
        self.whatif_engine = whatif_engine
        self.heatmap_engine = heatmap_engine
        self.metrics_engine = metrics_engine
        self.metrics_service = metrics_service
        self.session_service = session_service
        self.prompt_ml_scorer = prompt_ml_scorer

    async def generate(
        self,
        payload: GenerateRequest,
        *,
        request_id: str | None = None,
        actor_key: str = "guest:anonymous",
    ) -> GenerateResponse:
        """Run the full request pipeline for one prompt."""
        started_at = perf_counter()
        reference_image_used = payload.reference_image is not None
        prompt_for_session = payload.prompt.strip() or "Reference-image-driven generation"
        segment_profile = self.segmenter.segment(payload.prompt, reference_image_used=reference_image_used)
        generation = await (
            self.generator.generate_multimodal(payload.prompt, payload.reference_image)
            if payload.include_multimodal
            else self.generator.generate_mode_bundle(
                prompt=payload.prompt,
                mode=payload.mode,
                reference_image=payload.reference_image,
            )
        )

        primary_generation = generation.image if payload.mode == "image" else generation.text
        primary_output = primary_generation.output
        primary_provider = primary_generation.provider
        analysis_source = primary_generation.analysis_text or primary_output
        analysis = self.explainer.analyze_prompt(
            prompt=payload.prompt,
            output=analysis_source,
            mode=payload.mode,
            segment_profile=segment_profile,
            reference_image_used=reference_image_used,
        )

        what_if_task = (
            self.whatif_engine.analyze(
                prompt=payload.prompt,
                mode=payload.mode,
                segment_profile=segment_profile,
                reference_image=payload.reference_image,
                baseline=generation,
            )
            if payload.include_what_if
            else None
        )
        heatmap_task = (
            self.heatmap_engine.generate_heatmap(
                image_data_url=generation.image.output,
                segment_profile=segment_profile,
            )
            if payload.include_heatmap and payload.mode == "image" and generation.image.output
            else None
        )

        what_if, heatmap = await self._gather_optional(what_if_task, heatmap_task)
        total_latency_ms = round((perf_counter() - started_at) * 1000, 2)
        metrics = self.metrics_engine.compute(
            prompt=payload.prompt,
            mode=payload.mode,
            segment_profile=segment_profile,
            generation=generation,
            what_if=what_if,
            total_latency_ms=total_latency_ms,
        )

        score_details = self.prompt_ml_scorer.score(
            prompt=prompt_for_session,
            output=analysis_source or primary_output,
            mode=payload.mode,
            segment_profile=segment_profile,
            reference_image_used=reference_image_used,
        )
        session_payload = SessionCreate(
            prompt=prompt_for_session,
            actor_key=actor_key,
            output=primary_output,
            mode=payload.mode,
            source=payload.source,
            provider=primary_provider,
            response_time_ms=total_latency_ms,
            token_count=len(tokenize_text(prompt_for_session)),
            trust_score=score_details.trust,
            clarity_score=score_details.clarity,
            quality_score=score_details.quality,
            quality_label=quality_label_from_score(score_details.quality),
        )
        session = self.session_service.create_session(session_payload)

        self.metrics_service.store_metric(
            MetricCreateRequest(
                actor_key=actor_key,
                prompt_length=len(prompt_for_session),
                response_time_ms=total_latency_ms,
                endpoint="/generate",
                mode=payload.mode,
                trust_score=score_details.trust / 100,
                confidence_score=metrics.confidence,
                complexity_score=metrics.complexity,
                impact_score=self.metrics_engine.average_impact_score(what_if),
                provider=primary_provider,
                request_id=request_id,
            )
        )

        logger.info("Generated %s response in %.2f ms", payload.mode, total_latency_ms)
        return GenerateResponse(
            output=primary_output,
            provider=primary_provider,
            analysis_text=analysis_source or primary_output,
            tokens=tokenize_text(prompt_for_session),
            mapping=analysis.mapping,
            segments=analysis.segments,
            explanation_summary=analysis.summary,
            score_details=score_details,
            reference_image_used=reference_image_used,
            session=session,
            generated=(
                GeneratedArtifacts(
                    text=generation.text.output,
                    image=generation.image.output,
                    primary_output=primary_output,
                    providers=generation.providers,
                )
                if payload.include_multimodal
                else None
            ),
            segment_profile=segment_profile,
            what_if=what_if,
            heatmap=heatmap,
            metrics=metrics,
            request_id=request_id,
        )

    async def compare(
        self,
        payload: WhatIfRequest,
        *,
        request_id: str | None = None,
        actor_key: str = "guest:anonymous",
    ) -> WhatIfResponse:
        """Compare two prompt variants while keeping the legacy response contract."""
        difference = summarize_prompt_difference(
            original_prompt=payload.original_prompt,
            modified_prompt=payload.modified_prompt,
        )
        if payload.original_reference_image and not payload.modified_reference_image:
            difference = f"{difference} Variant B removes the reference image guide."
        elif payload.modified_reference_image and not payload.original_reference_image:
            difference = f"{difference} Variant B adds a reference image guide."

        original_prompt = payload.original_prompt.strip() or "Reference-image-driven generation"
        modified_prompt = payload.modified_prompt.strip() or "Reference-image-driven generation"
        original_generation, modified_generation = await asyncio.gather(
            self.generator.generate_mode_bundle(
                prompt=payload.original_prompt,
                mode=payload.mode,
                reference_image=payload.original_reference_image,
            ),
            self.generator.generate_mode_bundle(
                prompt=payload.modified_prompt,
                mode=payload.mode,
                reference_image=payload.modified_reference_image,
            ),
        )

        original_profile = self.segmenter.segment(
            payload.original_prompt,
            reference_image_used=payload.original_reference_image is not None,
        )
        modified_profile = self.segmenter.segment(
            payload.modified_prompt,
            reference_image_used=payload.modified_reference_image is not None,
        )
        original_analysis = self.explainer.analyze_prompt(
            prompt=payload.original_prompt,
            output=(
                original_generation.image.analysis_text or original_generation.image.output
                if payload.mode == "image"
                else original_generation.text.analysis_text or original_generation.text.output
            ),
            mode=payload.mode,
            segment_profile=original_profile,
            reference_image_used=payload.original_reference_image is not None,
        )
        modified_analysis = self.explainer.analyze_prompt(
            prompt=payload.modified_prompt,
            output=(
                modified_generation.image.analysis_text or modified_generation.image.output
                if payload.mode == "image"
                else modified_generation.text.analysis_text or modified_generation.text.output
            ),
            mode=payload.mode,
            segment_profile=modified_profile,
            reference_image_used=payload.modified_reference_image is not None,
        )

        original_primary = original_generation.image if payload.mode == "image" else original_generation.text
        modified_primary = modified_generation.image if payload.mode == "image" else modified_generation.text
        original_output = original_primary.output
        modified_output = modified_primary.output
        original_provider = original_primary.provider
        modified_provider = modified_primary.provider
        original_latency = original_primary.latency_ms
        modified_latency = modified_primary.latency_ms

        original_score_details = self.prompt_ml_scorer.score(
            prompt=original_prompt,
            output=original_primary.analysis_text or original_output,
            mode=payload.mode,
            segment_profile=original_profile,
            reference_image_used=payload.original_reference_image is not None,
        )
        modified_score_details = self.prompt_ml_scorer.score(
            prompt=modified_prompt,
            output=modified_primary.analysis_text or modified_output,
            mode=payload.mode,
            segment_profile=modified_profile,
            reference_image_used=payload.modified_reference_image is not None,
        )
        original_session_payload = SessionCreate(
            prompt=original_prompt,
            actor_key=actor_key,
            output=original_output,
            mode=payload.mode,
            source="what-if",
            provider=original_provider,
            response_time_ms=original_latency,
            token_count=len(tokenize_text(original_prompt)),
            trust_score=original_score_details.trust,
            clarity_score=original_score_details.clarity,
            quality_score=original_score_details.quality,
            quality_label=quality_label_from_score(original_score_details.quality),
            difference_summary=difference,
        )
        modified_session_payload = SessionCreate(
            prompt=modified_prompt,
            actor_key=actor_key,
            output=modified_output,
            mode=payload.mode,
            source="what-if",
            provider=modified_provider,
            response_time_ms=modified_latency,
            token_count=len(tokenize_text(modified_prompt)),
            trust_score=modified_score_details.trust,
            clarity_score=modified_score_details.clarity,
            quality_score=modified_score_details.quality,
            quality_label=quality_label_from_score(modified_score_details.quality),
            difference_summary=difference,
        )
        original_session = self.session_service.create_session(original_session_payload)
        modified_session = self.session_service.create_session(modified_session_payload)

        self.metrics_service.store_metric(
            MetricCreateRequest(
                actor_key=actor_key,
                prompt_length=len(original_prompt),
                response_time_ms=original_latency,
                endpoint="/what-if",
                mode=payload.mode,
                trust_score=original_score_details.trust / 100,
                provider=original_provider,
                request_id=request_id,
            )
        )
        self.metrics_service.store_metric(
            MetricCreateRequest(
                actor_key=actor_key,
                prompt_length=len(modified_prompt),
                response_time_ms=modified_latency,
                endpoint="/what-if",
                mode=payload.mode,
                trust_score=modified_score_details.trust / 100,
                provider=modified_provider,
                request_id=request_id,
            )
        )

        modified_what_if = await self.whatif_engine.analyze(
            prompt=payload.modified_prompt,
            mode=payload.mode,
            segment_profile=modified_profile,
            reference_image=payload.modified_reference_image,
            baseline=modified_generation,
        )
        return WhatIfResponse(
            difference=difference,
            original_session=original_session,
            modified_session=modified_session,
            original_segments=original_analysis.segments,
            modified_segments=modified_analysis.segments,
            original_explanation_summary=original_analysis.summary,
            modified_explanation_summary=modified_analysis.summary,
            segment_changes=self.explainer.compare_segments(
                original_analysis.segments,
                modified_analysis.segments,
            ),
            delta=ComparisonDelta(
                confidence=round(modified_session.trust_score - original_session.trust_score, 2),
                clarity=round(modified_session.clarity_score - original_session.clarity_score, 2),
                quality=round(modified_session.quality_score - original_session.quality_score, 2),
            ),
            variations=modified_what_if.variations,
            impact_scores=modified_what_if.impact_scores,
        )

    def analyze_prompt(self, payload: AnalyzeRequest) -> AnalyzeResponse:
        """Perform real-time NLP segmentation and explanation summary."""
        profile = self.segmenter.segment(payload.prompt, reference_image_used=False)
        analysis = self.explainer.analyze_prompt(
            prompt=payload.prompt,
            output=payload.prompt,
            mode=payload.mode,
            segment_profile=profile,
            reference_image_used=False,
        )
        score_details = self.prompt_ml_scorer.score(
            prompt=payload.prompt,
            output=payload.prompt,
            mode=payload.mode,
            segment_profile=profile,
            reference_image_used=False,
        )

        return AnalyzeResponse(
            segments=analysis.segments,
            explanation_summary=analysis.summary,
            score_details=score_details,
        )

    @staticmethod
    async def _gather_optional(*tasks):
        indexed_tasks = [(index, task) for index, task in enumerate(tasks) if task is not None]
        if not indexed_tasks:
            return tuple(None for _ in tasks)
        resolved = [None for _ in tasks]
        results = await asyncio.gather(*(task for _, task in indexed_tasks))
        for (index, _), result in zip(indexed_tasks, results):
            resolved[index] = result
        return tuple(resolved)

"""Where all our API routes connect to the app."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas import (
    ExplainRequest,
    ExplainResponse,
    GenerateRequest,
    GenerateResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    MetricCreateRequest,
    MetricCreateResponse,
    MetricSummaryResponse,
    SessionListResponse,
    DashboardMetricsResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.explainer import ExplainabilityService
from app.services.metrics_service import MetricsService
from app.services.orchestrator import XAIOrchestrator
from app.services.session_service import SessionService

router = APIRouter()
logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _get_orchestrator(request: Request) -> XAIOrchestrator:
    return request.app.state.orchestrator


def _get_explainer(request: Request) -> ExplainabilityService:
    return request.app.state.explainer


def _get_metrics_service(request: Request) -> MetricsService:
    return request.app.state.metrics_service


def _get_session_service(request: Request) -> SessionService:
    return request.app.state.session_service


@router.post("/generate", response_model=GenerateResponse, tags=["prompt"])
async def generate_content(payload: GenerateRequest, request: Request) -> GenerateResponse:
    """Get AI text and pictures, plus the data explaining how we got them."""
    orchestrator = _get_orchestrator(request)

    try:
        return await orchestrator.generate(payload, request_id=_request_id(request))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Generation failed")
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@router.post("/analyze", response_model=AnalyzeResponse, tags=["prompt"])
async def analyze_live(payload: AnalyzeRequest, request: Request) -> AnalyzeResponse:
    """Analyze text in real time to show live feedback in the UI."""
    orchestrator = _get_orchestrator(request)

    try:
        return orchestrator.analyze_prompt(payload)
    except Exception as exc:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@router.post("/what-if", response_model=WhatIfResponse, tags=["prompt"])
async def what_if_analysis(payload: WhatIfRequest, request: Request) -> WhatIfResponse:
    """Compare an old prompt to a new one and kick out a breakdown."""
    orchestrator = _get_orchestrator(request)

    try:
        return await orchestrator.compare(payload, request_id=_request_id(request))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("What-if analysis failed")
        raise HTTPException(status_code=500, detail=f"What-if analysis failed: {exc}") from exc


@router.post("/explain", response_model=ExplainResponse, tags=["explainability"])
async def explain_prompt(payload: ExplainRequest, request: Request) -> ExplainResponse:
    """Map out how much each word actually affected the final output."""
    explainer = _get_explainer(request)
    segmenter = request.app.state.segmenter

    try:
        profile = segmenter.segment(payload.prompt, reference_image_used=False)
        mapping = explainer.analyze_prompt(
            prompt=payload.prompt,
            output=payload.output,
            mode="text",
            segment_profile=profile,
            reference_image_used=False,
        ).mapping
        return ExplainResponse(mapping=mapping)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Explainability mapping failed")
        raise HTTPException(status_code=500, detail=f"Explainability mapping failed: {exc}") from exc


@router.post("/metrics", response_model=MetricCreateResponse, tags=["metrics"])
async def create_metric(payload: MetricCreateRequest, request: Request) -> MetricCreateResponse:
    """Save an event when a user does something."""
    service = _get_metrics_service(request)

    try:
        record_id = service.store_metric(payload)
        return MetricCreateResponse(status="stored", record_id=record_id)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metric storage failed")
        raise HTTPException(status_code=500, detail=f"Metric storage failed: {exc}") from exc


@router.get("/metrics", response_model=MetricSummaryResponse, tags=["metrics"])
async def read_metrics(request: Request) -> MetricSummaryResponse:
    """Fetch high-level stats of how the app is being used."""
    service = _get_metrics_service(request)

    try:
        return service.get_summary()
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metrics summary failed")
        raise HTTPException(status_code=500, detail=f"Metrics summary failed: {exc}") from exc


@router.get("/sessions", response_model=SessionListResponse, tags=["sessions"])
async def read_sessions(
    request: Request,
    limit: int = Query(default=12, ge=1, le=50),
) -> SessionListResponse:
    """Pull the most recent stuff users have generated."""
    service = _get_session_service(request)

    try:
        return service.list_sessions(limit=limit)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Session history failed")
        raise HTTPException(status_code=500, detail=f"Session history failed: {exc}") from exc


@router.get("/dashboard", response_model=DashboardMetricsResponse, tags=["sessions"])
async def read_dashboard(request: Request) -> DashboardMetricsResponse:
    """Gather up all the numbers we need to show on the dashboard."""
    service = _get_session_service(request)

    try:
        return service.get_dashboard_metrics()
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Dashboard metrics failed")
        raise HTTPException(status_code=500, detail=f"Dashboard metrics failed: {exc}") from exc

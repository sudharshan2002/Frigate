"""API routes for Frigate."""

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
    DeleteAccountResponse,
)
from app.services.explainer import ExplainabilityService
from app.services.account_service import AccountService
from app.services.metrics_service import MetricsService
from app.services.orchestrator import XAIOrchestrator
from app.services.session_service import SessionService

router = APIRouter()
logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _actor_key(request: Request) -> str:
    header_value = request.headers.get("x-frigate-actor", "").strip()
    return header_value or "guest:anonymous"


def _get_orchestrator(request: Request) -> XAIOrchestrator:
    return request.app.state.orchestrator


def _get_explainer(request: Request) -> ExplainabilityService:
    return request.app.state.explainer


def _get_metrics_service(request: Request) -> MetricsService:
    return request.app.state.metrics_service


def _get_session_service(request: Request) -> SessionService:
    return request.app.state.session_service


def _get_account_service(request: Request) -> AccountService:
    return request.app.state.account_service


def _access_token(request: Request) -> str:
    authorization = request.headers.get("authorization", "").strip()
    prefix = "bearer "
    if authorization.lower().startswith(prefix):
        return authorization[len(prefix):].strip()
    return ""


def _validation_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc))


def _internal_error(message: str) -> HTTPException:
    return HTTPException(status_code=500, detail=message)


@router.post("/generate", response_model=GenerateResponse, tags=["prompt"])
async def generate_content(payload: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate text or images and return the analysis used by the UI."""
    orchestrator = _get_orchestrator(request)

    try:
        return await orchestrator.generate(
            payload,
            request_id=_request_id(request),
            actor_key=_actor_key(request),
        )
    except ValueError as exc:
        logger.info("Generation rejected: %s", exc)
        raise _validation_error(exc) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Generation failed")
        raise _internal_error("Generation failed. Please try again.") from exc


@router.post("/analyze", response_model=AnalyzeResponse, tags=["prompt"])
async def analyze_live(payload: AnalyzeRequest, request: Request) -> AnalyzeResponse:
    """Analyze a draft prompt for live feedback in the UI."""
    orchestrator = _get_orchestrator(request)

    try:
        return orchestrator.analyze_prompt(payload)
    except ValueError as exc:
        logger.info("Analysis rejected: %s", exc)
        raise _validation_error(exc) from exc
    except Exception as exc:
        logger.exception("Analysis failed")
        raise _internal_error("Analysis failed. Please try again.") from exc


@router.post("/what-if", response_model=WhatIfResponse, tags=["prompt"])
async def what_if_analysis(payload: WhatIfRequest, request: Request) -> WhatIfResponse:
    """Compare two prompts and return the differences."""
    orchestrator = _get_orchestrator(request)

    try:
        return await orchestrator.compare(
            payload,
            request_id=_request_id(request),
            actor_key=_actor_key(request),
        )
    except ValueError as exc:
        logger.info("What-if analysis rejected: %s", exc)
        raise _validation_error(exc) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("What-if analysis failed")
        raise _internal_error("What-if analysis failed. Please try again.") from exc


@router.post("/explain", response_model=ExplainResponse, tags=["explainability"])
async def explain_prompt(payload: ExplainRequest, request: Request) -> ExplainResponse:
    """Estimate how each segment influenced the final result."""
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
    except ValueError as exc:
        logger.info("Explainability mapping rejected: %s", exc)
        raise _validation_error(exc) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Explainability mapping failed")
        raise _internal_error("Explainability mapping failed. Please try again.") from exc


@router.post("/metrics", response_model=MetricCreateResponse, tags=["metrics"])
async def create_metric(payload: MetricCreateRequest, request: Request) -> MetricCreateResponse:
    """Save an event when a user does something."""
    service = _get_metrics_service(request)

    try:
        record_id = service.store_metric(payload.model_copy(update={"actor_key": payload.actor_key or _actor_key(request)}))
        return MetricCreateResponse(status="stored", record_id=record_id)
    except ValueError as exc:
        logger.info("Metric storage rejected: %s", exc)
        raise _validation_error(exc) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metric storage failed")
        raise _internal_error("Metric storage failed. Please try again.") from exc


@router.get("/metrics", response_model=MetricSummaryResponse, tags=["metrics"])
async def read_metrics(request: Request) -> MetricSummaryResponse:
    """Fetch high-level stats of how the app is being used."""
    service = _get_metrics_service(request)

    try:
        return service.get_summary(actor_key=_actor_key(request))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metrics summary failed")
        raise _internal_error("Metrics summary failed. Please try again.") from exc


@router.get("/sessions", response_model=SessionListResponse, tags=["sessions"])
async def read_sessions(
    request: Request,
    limit: int = Query(default=12, ge=1, le=50),
) -> SessionListResponse:
    """Pull the most recent stuff users have generated."""
    service = _get_session_service(request)

    try:
        return service.list_sessions(limit=limit, actor_key=_actor_key(request))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Session history failed")
        raise _internal_error("Session history failed. Please try again.") from exc


@router.get("/dashboard", response_model=DashboardMetricsResponse, tags=["sessions"])
async def read_dashboard(request: Request) -> DashboardMetricsResponse:
    """Gather up all the numbers we need to show on the dashboard."""
    service = _get_session_service(request)

    try:
        return service.get_dashboard_metrics(actor_key=_actor_key(request))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Dashboard metrics failed")
        raise _internal_error("Dashboard metrics failed. Please try again.") from exc


@router.delete("/account", response_model=DeleteAccountResponse, tags=["account"])
async def delete_account(request: Request) -> DeleteAccountResponse:
    """Delete the currently signed-in Supabase account."""
    service = _get_account_service(request)
    access_token = _access_token(request)

    if not access_token:
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    try:
        user_id = service.delete_current_user(access_token)
        return DeleteAccountResponse(status="deleted", user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Account deletion failed")
        raise _internal_error("Account deletion failed. Please try again.") from exc

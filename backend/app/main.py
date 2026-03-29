"""Main setup file for the backend API."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.services.explainer import ExplainabilityService
from app.services.generator import GenerationEngine
from app.services.heatmap_engine import HeatmapEngine
from app.services.account_service import AccountService
from app.services.metrics_engine import MetricsEngine
from app.services.metrics_service import MetricsService
from app.services.orchestrator import XAIOrchestrator
from app.services.segmenter import PromptSegmenter
from app.services.session_service import SessionService
from app.services.whatif_engine import WhatIfEngine
from config import get_settings


def _configure_logging() -> None:
    """Set up basic logging for the app."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Spin up all our shared services when the app starts."""
    settings = get_settings()

    generator = GenerationEngine(settings)
    account_service = AccountService(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    segmenter = PromptSegmenter(settings)
    explainer = ExplainabilityService(settings)
    metrics_service = MetricsService(
        settings.sqlite_db_path,
        enabled=False,
    )
    session_service = SessionService(
        settings.sqlite_db_path,
        enabled=False,
    )
    heatmap_engine = HeatmapEngine(settings)
    metrics_engine = MetricsEngine()
    whatif_engine = WhatIfEngine(generator)
    orchestrator = XAIOrchestrator(
        generator=generator,
        segmenter=segmenter,
        explainer=explainer,
        whatif_engine=whatif_engine,
        heatmap_engine=heatmap_engine,
        metrics_engine=metrics_engine,
        metrics_service=metrics_service,
        session_service=session_service,
    )

    app.state.settings = settings
    app.state.genai_service = generator
    app.state.generator = generator
    app.state.account_service = account_service
    app.state.segmenter = segmenter
    app.state.explanation_service = explainer
    app.state.explainer = explainer
    app.state.metrics_engine = metrics_engine
    app.state.metrics_service = metrics_service
    app.state.session_service = session_service
    app.state.whatif_engine = whatif_engine
    app.state.heatmap_engine = heatmap_engine
    app.state.orchestrator = orchestrator

    logging.getLogger(__name__).info("Backend started with prefix %s", settings.api_prefix)
    yield

    await app.state.generator.close()
    logging.getLogger(__name__).info("Backend shutdown complete")


def create_app() -> FastAPI:
    """Build and configure the main FastAPI app instance."""
    _configure_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="2.0.0",
        description="Backend API for Frigate's modular explainable multimodal AI pipeline.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_logging_middleware(request: Request, call_next):
        request_id = uuid4().hex[:12]
        request.state.request_id = request_id
        started_at = perf_counter()
        logger = logging.getLogger("frigate.request")
        logger.info("request_start id=%s method=%s path=%s", request_id, request.method, request.url.path)
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("request_failed id=%s path=%s", request_id, request.url.path)
            raise

        latency_ms = round((perf_counter() - started_at) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_complete id=%s path=%s status=%s latency_ms=%.2f",
            request_id,
            request.url.path,
            response.status_code,
            latency_ms,
        )
        return response

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

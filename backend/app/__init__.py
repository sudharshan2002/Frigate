"""Application factory for the PromptLens-style backend."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.explain_routes import router as explain_router
from app.routes.metrics_routes import router as metrics_router
from app.routes.prompt_routes import router as prompt_router
from app.routes.session_routes import router as session_router
from app.services.explanation_service import ExplanationService
from app.services.genai_service import GenAIService
from app.services.metrics_service import MetricsService
from app.services.session_service import SessionService
from config import get_settings


def _configure_logging() -> None:
    """Configure a simple application logger once per process."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize shared services during app startup."""
    settings = get_settings()

    app.state.settings = settings
    app.state.genai_service = GenAIService(settings)
    app.state.explanation_service = ExplanationService(settings)
    app.state.metrics_service = MetricsService(settings.sqlite_db_path)
    app.state.session_service = SessionService(settings.sqlite_db_path)
    app.state.metrics_service.init_storage()
    app.state.session_service.init_storage()

    logging.getLogger(__name__).info("Backend started with prefix %s", settings.api_prefix)
    yield

    await app.state.genai_service.close()
    logging.getLogger(__name__).info("Backend shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    _configure_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Backend API for an explainable multimodal GenAI platform.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(prompt_router, prefix=settings.api_prefix)
    app.include_router(explain_router, prefix=settings.api_prefix)
    app.include_router(metrics_router, prefix=settings.api_prefix)
    app.include_router(session_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app

"""Configuration setup for the python server."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _default_sqlite_path() -> Path:
    """Try to use a real disk if we have one on Render, otherwise just drop it in the folder."""
    render_disk_path = os.getenv("RENDER_DISK_PATH")
    # Fallback to local storage if RENDER_DISK_PATH is /var/data (common on Render Free Tier without a disk)
    if render_disk_path and render_disk_path != "/var/data":
        return Path(render_disk_path) / "metrics.db"
    return BASE_DIR / "metrics.db"


@dataclass(frozen=True)
class Settings:
    """All the environment variables we need to run."""

    app_name: str
    api_prefix: str
    host: str
    port: int
    reload: bool
    cors_origins: list[str]
    groq_api_key: str | None
    groq_text_model: str
    groq_analysis_model: str
    groq_timeout_seconds: int
    hf_api_token: str | None
    hf_provider: str
    hf_router_base_url: str
    hf_text_to_image_model: str
    hf_image_to_image_model: str
    hf_vision_model: str
    hf_image_width: int
    hf_image_height: int
    hf_num_inference_steps: int
    hf_guidance_scale: float
    sqlite_db_path: Path
    allow_remote_reference_images: bool
    enable_session_history: bool


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Grab the settings and cache them so we don't spam env reads."""
    cors_origins = os.getenv("CORS_ORIGINS", "*")
    db_path = os.getenv("SQLITE_DB_PATH", str(_default_sqlite_path()))

    return Settings(
        app_name=os.getenv("APP_NAME", "Frigate Backend"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=_parse_bool(os.getenv("RELOAD"), default=False),
        cors_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()] or ["*"],
        groq_api_key=os.getenv("GROQ_API_KEY"),
        groq_text_model=os.getenv("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile"),
        groq_analysis_model=os.getenv("GROQ_ANALYSIS_MODEL", "llama-3.1-8b-instant"),
        groq_timeout_seconds=int(os.getenv("GROQ_TIMEOUT_SECONDS", "45")),
        hf_api_token=os.getenv("HF_TOKEN"),
        hf_provider=os.getenv("HF_PROVIDER", "hf-inference"),
        hf_router_base_url=os.getenv("HF_ROUTER_BASE_URL", "https://router.huggingface.co/v1"),
        hf_text_to_image_model=os.getenv("HF_TEXT_TO_IMAGE_MODEL", "black-forest-labs/FLUX.1-dev"),
        hf_image_to_image_model=os.getenv("HF_IMAGE_TO_IMAGE_MODEL", "black-forest-labs/FLUX.1-dev"),
        hf_vision_model=os.getenv("HF_VISION_MODEL", "CohereLabs/aya-vision-32b:cohere"),
        hf_image_width=int(os.getenv("HF_IMAGE_WIDTH", "1280")),
        hf_image_height=int(os.getenv("HF_IMAGE_HEIGHT", "768")),
        hf_num_inference_steps=int(os.getenv("HF_NUM_INFERENCE_STEPS", "28")),
        hf_guidance_scale=float(os.getenv("HF_GUIDANCE_SCALE", "5.5")),
        sqlite_db_path=Path(db_path),
        allow_remote_reference_images=_parse_bool(os.getenv("ALLOW_REMOTE_REFERENCE_IMAGES"), default=False),
        enable_session_history=_parse_bool(os.getenv("ENABLE_SESSION_HISTORY"), default=False),
    )

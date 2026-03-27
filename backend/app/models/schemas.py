"""Request and response schemas for the API."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class ReferenceImageInput(BaseModel):
    """Optional reference image supplied by the user."""

    data_url: str | None = Field(default=None, description="Base64 data URL for a locally uploaded image")
    url: str | None = Field(default=None, description="Remote URL for a reference image")
    mime_type: str | None = Field(default=None, max_length=64)
    name: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_reference_image(self) -> "ReferenceImageInput":
        if not (self.data_url or self.url):
            raise ValueError("Reference images require either a data_url or a url.")
        return self


class GenerateRequest(BaseModel):
    """Input payload for content generation."""

    prompt: str = Field(default="", description="User prompt text")
    mode: Literal["text", "image"] = Field(default="text")
    source: Literal["composer", "what-if", "api"] = Field(default="composer")
    reference_image: ReferenceImageInput | None = Field(default=None)

    @model_validator(mode="after")
    def validate_generate_request(self) -> "GenerateRequest":
        if not self.prompt.strip() and self.reference_image is None:
            raise ValueError("Provide prompt text, a reference image, or both.")
        return self


class TokenImpact(BaseModel):
    """Single token or segment impact value."""

    token: str
    impact: float = Field(..., ge=0.0, le=1.0)


class PromptSegment(BaseModel):
    """Structured prompt segment returned to the UI."""

    id: str
    label: str = Field(..., min_length=1, max_length=40)
    text: str = Field(..., min_length=1, max_length=240)
    kind: str = Field(..., min_length=1, max_length=40)
    impact: float = Field(..., ge=0.0, le=1.0)
    effect: str = Field(..., min_length=1, max_length=320)


class PromptExplanationSummary(BaseModel):
    """High-level explanation copy for the current prompt."""

    overview: str = Field(..., min_length=1, max_length=500)
    segment_strategy: str = Field(..., min_length=1, max_length=500)
    improvement_tip: str = Field(..., min_length=1, max_length=500)


class SegmentChange(BaseModel):
    """Difference summary for a segment between prompt variants."""

    label: str = Field(..., min_length=1, max_length=40)
    before: str = Field(..., min_length=1, max_length=240)
    after: str = Field(..., min_length=1, max_length=240)
    effect: str = Field(..., min_length=1, max_length=320)
    change_type: Literal["added", "removed", "modified", "unchanged"]


class ExplainRequest(BaseModel):
    """Input payload for prompt explainability."""

    prompt: str = Field(..., min_length=1)
    output: str = Field(..., min_length=1)


class ExplainResponse(BaseModel):
    """Explainability response payload."""

    mapping: list[TokenImpact]


class SessionCreate(BaseModel):
    """Input payload for creating a stored generation session."""

    prompt: str = Field(default="")
    output: str = Field(..., min_length=1)
    mode: Literal["text", "image"]
    source: Literal["composer", "what-if", "api"]
    provider: str = Field(..., min_length=1, max_length=64)
    response_time_ms: float = Field(..., ge=0)
    token_count: int = Field(..., ge=0)
    trust_score: float = Field(..., ge=0, le=100)
    clarity_score: float = Field(..., ge=0, le=100)
    quality_score: float = Field(..., ge=0, le=100)
    quality_label: str = Field(..., min_length=1, max_length=24)
    difference_summary: str | None = Field(default=None, max_length=1000)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @field_validator("created_at")
    @classmethod
    def validate_session_created_at(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class SessionRecord(BaseModel):
    """Stored generation session payload."""

    id: int
    prompt: str
    output: str
    mode: Literal["text", "image"]
    source: Literal["composer", "what-if", "api"]
    provider: str
    response_time_ms: float
    token_count: int
    trust_score: float
    clarity_score: float
    quality_score: float
    quality_label: str
    difference_summary: str | None = None
    created_at: str


class GenerateResponse(BaseModel):
    """Output payload for generated content."""

    output: str
    provider: str
    tokens: list[str]
    mapping: list[TokenImpact]
    segments: list[PromptSegment]
    explanation_summary: PromptExplanationSummary
    reference_image_used: bool = False
    session: SessionRecord


class WhatIfRequest(BaseModel):
    """Input payload for prompt delta analysis."""

    original_prompt: str = Field(default="")
    modified_prompt: str = Field(default="")
    mode: Literal["text", "image"] = Field(default="image")
    original_reference_image: ReferenceImageInput | None = Field(default=None)
    modified_reference_image: ReferenceImageInput | None = Field(default=None)

    @model_validator(mode="after")
    def validate_what_if_request(self) -> "WhatIfRequest":
        if not self.original_prompt.strip() and self.original_reference_image is None:
            raise ValueError("Variant A requires prompt text, a reference image, or both.")
        if not self.modified_prompt.strip() and self.modified_reference_image is None:
            raise ValueError("Variant B requires prompt text, a reference image, or both.")
        return self


class ComparisonDelta(BaseModel):
    """Metric deltas between original and modified variants."""

    confidence: float
    clarity: float
    quality: float


class WhatIfResponse(BaseModel):
    """Output payload for prompt delta analysis."""

    difference: str
    original_session: SessionRecord
    modified_session: SessionRecord
    original_segments: list[PromptSegment]
    modified_segments: list[PromptSegment]
    original_explanation_summary: PromptExplanationSummary
    modified_explanation_summary: PromptExplanationSummary
    segment_changes: list[SegmentChange]
    delta: ComparisonDelta


class MetricCreateRequest(BaseModel):
    """Input payload for storing interaction metrics."""

    prompt_length: int = Field(..., ge=0)
    response_time_ms: float = Field(..., ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    endpoint: str | None = Field(default=None, max_length=64)
    mode: Literal["text", "image"] | None = Field(default=None)
    trust_score: float | None = Field(default=None, ge=0, le=1)
    feedback: str | None = Field(default=None, max_length=1000)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC timestamp in ISO-8601 format",
    )

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class MetricCreateResponse(BaseModel):
    """Output payload after storing a metric."""

    status: str
    record_id: int


class MetricSummaryResponse(BaseModel):
    """Aggregate metrics response."""

    avg_response_time: float
    avg_rating: float | None
    total_requests: int


class RecentRun(BaseModel):
    """Recent session item for dashboard views."""

    id: int
    prompt: str
    mode: Literal["text", "image"]
    provider: str
    confidence: float
    clarity: float
    quality: float
    quality_label: str
    created_at: str


class TrendPoint(BaseModel):
    """Daily trend entry for confidence, clarity, and quality."""

    day: str
    confidence: float
    clarity: float
    quality: float


class UsagePoint(BaseModel):
    """Run counts bucketed by hour."""

    hour: str
    runs: int


class SystemStatusItem(BaseModel):
    """System status card payload."""

    label: str
    value: str
    status: str


class DashboardMetricsResponse(BaseModel):
    """Dashboard summary payload."""

    avg_confidence: float
    avg_clarity: float
    avg_quality: float
    avg_response_time: float
    total_runs: int
    trend: list[TrendPoint]
    usage_today: list[UsagePoint]
    recent_runs: list[RecentRun]
    system_status: list[SystemStatusItem]
    storage_bytes: int


class SessionListResponse(BaseModel):
    """List of recent sessions."""

    sessions: list[SessionRecord]
    total_runs: int
    storage_bytes: int

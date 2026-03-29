"""All the Pydantic models for data going in and out of the API."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class ReferenceImageInput(BaseModel):
    """An image the user might upload to base the generation on."""

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
    """The data we expect when someone hits the generate endpoint."""

    prompt: str = Field(default="", description="User prompt text")
    mode: Literal["text", "image"] = Field(default="text")
    source: Literal["composer", "what-if", "api"] = Field(default="composer")
    reference_image: ReferenceImageInput | None = Field(default=None)
    include_multimodal: bool = Field(default=False)
    include_what_if: bool = Field(default=False)
    include_heatmap: bool = Field(default=False)

    @model_validator(mode="after")
    def validate_generate_request(self) -> "GenerateRequest":
        if not self.prompt.strip() and self.reference_image is None:
            raise ValueError("Provide prompt text, a reference image, or both.")
        return self
class AnalyzeRequest(BaseModel):
    """Data for live-typing analysis."""
    prompt: str = Field(..., min_length=1)
    mode: Literal["text", "image"] = Field(default="text")


class AnalyzeResponse(BaseModel):
    """What we send back after a live analysis."""
    segments: list[PromptSegment]
    explanation_summary: PromptExplanationSummary


class TokenImpact(BaseModel):
    token: str
    impact: float = Field(..., ge=0.0, le=1.0)


class PromptSegment(BaseModel):
    id: str
    label: str = Field(..., min_length=1, max_length=40)
    text: str = Field(..., min_length=1, max_length=240)
    kind: str = Field(..., min_length=1, max_length=40)
    impact: float = Field(..., ge=0.0, le=1.0)
    effect: str = Field(..., min_length=1, max_length=320)


class PromptSegmentProfile(BaseModel):
    object: str | None = Field(default=None, max_length=240)
    attributes: list[str] = Field(default_factory=list)
    style: list[str] = Field(default_factory=list)
    environment: list[str] = Field(default_factory=list)
    lighting: list[str] = Field(default_factory=list)
    raw_prompt: str = Field(default="")
    reference_image_used: bool = Field(default=False)


class PromptExplanationSummary(BaseModel):
    overview: str = Field(..., min_length=1, max_length=500)
    segment_strategy: str = Field(..., min_length=1, max_length=500)
    improvement_tip: str = Field(..., min_length=1, max_length=500)


class SegmentChange(BaseModel):
    label: str = Field(..., min_length=1, max_length=40)
    before: str = Field(..., min_length=1, max_length=240)
    after: str = Field(..., min_length=1, max_length=240)
    effect: str = Field(..., min_length=1, max_length=320)
    change_type: Literal["added", "removed", "modified", "unchanged"]


class ExplainRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    output: str = Field(..., min_length=1)


class ExplainResponse(BaseModel):
    mapping: list[TokenImpact]


class SessionCreate(BaseModel):
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


class GeneratedArtifacts(BaseModel):
    text: str
    image: str
    primary_output: str
    providers: dict[str, str]


class WhatIfVariation(BaseModel):
    removed: str = Field(..., min_length=1, max_length=120)
    impact: Literal["low", "medium", "high"]
    difference: str = Field(..., min_length=1, max_length=500)
    prompt_variant: str = Field(..., min_length=1, max_length=1000)
    score: float = Field(..., ge=0.0, le=1.0)


class WhatIfAnalysis(BaseModel):
    variations: list[WhatIfVariation] = Field(default_factory=list)
    impact_scores: dict[str, float] = Field(default_factory=dict)
    mode: Literal["text", "image"] = Field(default="text")


class GenerationMetrics(BaseModel):
    latency_ms: float = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=100)
    complexity: float = Field(..., ge=0, le=100)
    impact_scores: dict[str, float] = Field(default_factory=dict)
    modality_latency: dict[str, float] = Field(default_factory=dict)


class GenerateResponse(BaseModel):
    output: str
    provider: str
    analysis_text: str = Field(default="")
    tokens: list[str]
    mapping: list[TokenImpact]
    segments: list[PromptSegment]
    explanation_summary: PromptExplanationSummary
    reference_image_used: bool = False
    session: SessionRecord
    generated: GeneratedArtifacts | None = None
    segment_profile: PromptSegmentProfile | None = None
    what_if: WhatIfAnalysis | None = None
    heatmap: str | None = None
    metrics: GenerationMetrics | None = None
    request_id: str | None = None


class WhatIfRequest(BaseModel):
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
    confidence: float
    clarity: float
    quality: float


class WhatIfResponse(BaseModel):
    difference: str
    original_session: SessionRecord
    modified_session: SessionRecord
    original_segments: list[PromptSegment]
    modified_segments: list[PromptSegment]
    original_explanation_summary: PromptExplanationSummary
    modified_explanation_summary: PromptExplanationSummary
    segment_changes: list[SegmentChange]
    delta: ComparisonDelta
    variations: list[WhatIfVariation] = Field(default_factory=list)
    impact_scores: dict[str, float] = Field(default_factory=dict)


class MetricCreateRequest(BaseModel):
    prompt_length: int = Field(..., ge=0)
    response_time_ms: float = Field(..., ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    endpoint: str | None = Field(default=None, max_length=64)
    mode: Literal["text", "image"] | None = Field(default=None)
    trust_score: float | None = Field(default=None, ge=0, le=1)
    confidence_score: float | None = Field(default=None, ge=0, le=100)
    complexity_score: float | None = Field(default=None, ge=0, le=100)
    impact_score: float | None = Field(default=None, ge=0, le=100)
    provider: str | None = Field(default=None, max_length=64)
    request_id: str | None = Field(default=None, max_length=64)
    feedback: str | None = Field(default=None, max_length=1000)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class MetricCreateResponse(BaseModel):
    status: str
    record_id: int


class MetricSummaryResponse(BaseModel):
    avg_response_time: float
    avg_rating: float | None
    total_requests: int
    avg_confidence_score: float | None = None
    avg_complexity_score: float | None = None
    avg_impact_score: float | None = None


class RecentRun(BaseModel):
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
    day: str
    confidence: float
    clarity: float
    quality: float


class UsagePoint(BaseModel):
    hour: str
    runs: int


class SystemStatusItem(BaseModel):
    label: str
    value: str
    status: str


class DashboardMetricsResponse(BaseModel):
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
    avg_impact_score: float | None = None
    avg_prompt_complexity: float | None = None


class SessionListResponse(BaseModel):
    sessions: list[SessionRecord]
    total_runs: int
    storage_bytes: int

"""Heuristic metrics used by the app."""

from __future__ import annotations

from statistics import mean

from app.schemas import GenerationMetrics, PromptSegmentProfile, WhatIfAnalysis
from app.services.generator import MultimodalGenerationResult
from app.utils.helpers import clamp, similarity_ratio, tokenize_text


class MetricsEngine:
    """Compute latency, confidence, complexity, and impact metrics."""

    def compute(
        self,
        *,
        prompt: str,
        mode: str,
        segment_profile: PromptSegmentProfile,
        generation: MultimodalGenerationResult,
        what_if: WhatIfAnalysis | None,
        total_latency_ms: float,
    ) -> GenerationMetrics:
        """Compute explainability metrics for a generation run."""
        primary_generation = generation.image if mode == "image" else generation.text
        analysis_source = primary_generation.analysis_text or primary_generation.output
        prompt_tokens = tokenize_text(prompt)
        prompt_overlap = similarity_ratio(prompt, analysis_source)
        active_segments = sum(
            1
            for value in (
                segment_profile.object,
                segment_profile.attributes,
                segment_profile.style,
                segment_profile.environment,
                segment_profile.lighting,
            )
            if value
        )

        complexity = clamp(18 + len(prompt_tokens) * 2.4 + active_segments * 9, 0, 100)
        confidence = clamp(
            52
            + prompt_overlap * 18
            + active_segments * 4.5
            + (6 if mode == "image" and generation.image.output else 0)
            - min(total_latency_ms / 500, 14),
            0,
            99,
        )
        modality_latency = {
            "text": round(generation.text.latency_ms, 2),
            "image": round(generation.image.latency_ms, 2),
        }
        impact_scores = {key: round(value, 2) for key, value in (what_if.impact_scores if what_if else {}).items()}

        return GenerationMetrics(
            latency_ms=round(total_latency_ms, 2),
            confidence=round(confidence, 2),
            complexity=round(complexity, 2),
            impact_scores=impact_scores,
            modality_latency=modality_latency,
        )

    @staticmethod
    def average_impact_score(what_if: WhatIfAnalysis | None) -> float | None:
        """Return a single dashboard-friendly impact average when available."""
        if not what_if or not what_if.impact_scores:
            return None
        return round(mean(what_if.impact_scores.values()), 2)

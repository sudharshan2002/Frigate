"""Difference analysis for generated image responses using prompt-side proxies."""

from __future__ import annotations

from dataclasses import dataclass

from app.utils.helpers import clamp, similarity_ratio, tokenize_text, trim_text


@dataclass(frozen=True)
class ImageDiffResult:
    score: float
    similarity: float
    prompt_alignment_shift: float
    summary: str


class ImageDiffEngine:
    """Estimate image variation using generation analysis text and prompt alignment."""

    def compare(self, *, baseline_analysis: str, candidate_analysis: str, prompt: str) -> ImageDiffResult:
        similarity = similarity_ratio(baseline_analysis, candidate_analysis)
        prompt_tokens = {token.lower() for token in tokenize_text(prompt)}
        baseline_tokens = {token.lower() for token in tokenize_text(baseline_analysis)}
        candidate_tokens = {token.lower() for token in tokenize_text(candidate_analysis)}

        baseline_alignment = (
            len(prompt_tokens & baseline_tokens) / len(prompt_tokens)
            if prompt_tokens
            else 0.0
        )
        candidate_alignment = (
            len(prompt_tokens & candidate_tokens) / len(prompt_tokens)
            if prompt_tokens
            else 0.0
        )
        alignment_shift = abs(baseline_alignment - candidate_alignment)
        score = clamp((1.0 - similarity) * 0.68 + alignment_shift * 0.32, 0.0, 1.0)

        summary_parts: list[str] = []
        if similarity < 0.62:
            summary_parts.append("The image changed a lot after the prompt edit.")
        elif similarity < 0.8:
            summary_parts.append("The image changed noticeably after the prompt edit.")
        else:
            summary_parts.append("The image stayed fairly close to the original.")
        if alignment_shift > 0.18:
            summary_parts.append("Prompt-to-image alignment moved by a meaningful amount.")

        return ImageDiffResult(
            score=round(score, 2),
            similarity=round(similarity, 2),
            prompt_alignment_shift=round(alignment_shift, 2),
            summary=trim_text(" ".join(summary_parts), 240),
        )

"""Prompt explainability logic built on top of structured segmentation."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas import PromptExplanationSummary, PromptSegment, PromptSegmentProfile, SegmentChange, TokenImpact
from app.utils.helpers import normalize_scores, tokenize_text, trim_text
from config import Settings


@dataclass(frozen=True)
class PromptAnalysisResult:
    """Internal structured prompt analysis."""

    segments: list[PromptSegment]
    summary: PromptExplanationSummary
    mapping: list[TokenImpact]


class ExplainabilityService:
    """Generate prompt segments, effect descriptions, and compact impact mappings."""

    _effect_templates = {
        "object": "This is the main subject, so it usually has the biggest effect on the result.",
        "attributes": "These modifiers shape important descriptive traits such as color, texture, and size.",
        "style": "This steers the aesthetic treatment, tone, and finishing decisions.",
        "environment": "This places the subject in context and influences scene layout or narrative framing.",
        "lighting": "This changes exposure, mood, and visual emphasis across the final result.",
        "reference": "This uses the supplied image as a grounding signal for the rest of the prompt.",
    }

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def analyze_prompt(
        self,
        *,
        prompt: str,
        output: str,
        mode: str,
        segment_profile: PromptSegmentProfile,
        reference_image_used: bool = False,
    ) -> PromptAnalysisResult:
        """Return structured prompt analysis for the supplied generation."""
        segments = self._segments_from_profile(segment_profile, mode=mode, reference_image_used=reference_image_used)
        mapping = self.build_token_mapping(prompt=prompt, output=output, segments=segments)
        summary = self._build_summary(segment_profile=segment_profile, segments=segments, mode=mode)
        return PromptAnalysisResult(segments=segments, summary=summary, mapping=mapping)

    def compare_segments(
        self,
        original_segments: list[PromptSegment],
        modified_segments: list[PromptSegment],
    ) -> list[SegmentChange]:
        """Create a compact diff between two segmented prompt variants."""
        original_by_label = {segment.label.lower(): segment for segment in original_segments}
        modified_by_label = {segment.label.lower(): segment for segment in modified_segments}

        ordered_labels: list[str] = []
        for collection in (original_segments, modified_segments):
            for segment in collection:
                label_key = segment.label.lower()
                if label_key not in ordered_labels:
                    ordered_labels.append(label_key)

        changes: list[SegmentChange] = []
        for label_key in ordered_labels:
            before = original_by_label.get(label_key)
            after = modified_by_label.get(label_key)

            if before and after and before.text == after.text:
                change_type = "unchanged"
                effect = "This segment stayed stable, so it should not be driving the main difference."
            elif before and after:
                change_type = "modified"
                effect = f'The "{after.label}" segment changed wording, so it is likely contributing to the visible delta.'
            elif before:
                change_type = "removed"
                effect = f'The "{before.label}" segment was removed, reducing its influence in variant B.'
            else:
                change_type = "added"
                effect = f'The "{after.label}" segment was added in variant B, so it likely contributes to the change.'

            label = (after or before).label
            changes.append(
                SegmentChange(
                    label=label,
                    before=before.text if before else "Not present in variant A.",
                    after=after.text if after else "Not present in variant B.",
                    effect=effect,
                    change_type=change_type,
                )
            )

        return changes

    def build_token_mapping(
        self,
        prompt: str,
        output: str,
        segments: list[PromptSegment] | None = None,
    ) -> list[TokenImpact]:
        """Create a UI-friendly impact list from segments or prompt tokens."""
        if segments:
            return [
                TokenImpact(token=trim_text(segment.text, 38), impact=round(segment.impact, 2))
                for segment in segments[:6]
            ]

        prompt_tokens = tokenize_text(prompt)
        output_tokens = {token.lower() for token in tokenize_text(output)}
        if not prompt_tokens:
            return []

        raw_scores: list[float] = []
        for index, token in enumerate(prompt_tokens):
            score = 0.24
            score += min(len(token), 12) / 22
            score += 0.16 if token.lower() in output_tokens else 0.0
            score += max(0.0, 0.18 - index * 0.02)
            raw_scores.append(score)

        normalized = normalize_scores(raw_scores)
        return [
            TokenImpact(token=token, impact=round(score, 2))
            for token, score in zip(prompt_tokens[:6], normalized[:6])
        ]

    def _segments_from_profile(
        self,
        profile: PromptSegmentProfile,
        *,
        mode: str,
        reference_image_used: bool,
    ) -> list[PromptSegment]:
        segment_specs: list[tuple[str, str, str, float]] = []

        if profile.object:
            segment_specs.append(("Object", trim_text(profile.object, 240), "object", 0.96))
        if profile.attributes:
            segment_specs.append(("Attributes", trim_text(", ".join(profile.attributes), 240), "attributes", 0.78))
        if profile.style:
            segment_specs.append(("Style", trim_text(", ".join(profile.style), 240), "style", 0.72))
        if profile.environment:
            segment_specs.append(("Environment", trim_text(", ".join(profile.environment), 240), "environment", 0.68))
        if profile.lighting:
            segment_specs.append(("Lighting", trim_text(", ".join(profile.lighting), 240), "lighting", 0.64))
        if reference_image_used:
            segment_specs.append(("Reference", "Attached reference image", "reference", 0.62))

        if not segment_specs:
            segment_specs.append(("Object", "Untitled prompt", "object", 0.75))

        normalized = normalize_scores(score for _, _, _, score in segment_specs)
        segments: list[PromptSegment] = []
        for index, ((label, text, kind, _), impact) in enumerate(zip(segment_specs, normalized), start=1):
            effect = self._effect_templates.get(kind, self._effect_templates["attributes"])
            if kind == "object" and mode == "image":
                effect = f"{effect} In image mode, it typically controls the focal region and scene center."
            elif kind == "style" and mode == "text":
                effect = f"{effect} In text mode, it influences wording, pacing, and polish."
            segments.append(
                PromptSegment(
                    id=f"segment-{index}",
                    label=label,
                    text=text,
                    kind=kind,
                    impact=round(impact, 2),
                    effect=effect,
                )
            )
        return segments

    @staticmethod
    def _build_summary(
        *,
        segment_profile: PromptSegmentProfile,
        segments: list[PromptSegment],
        mode: str,
    ) -> PromptExplanationSummary:
        active_parts = [segment.label.lower() for segment in segments[:4]]
        overview = (
            f"This {mode} request was broken into {', '.join(active_parts)} so each prompt part can be inspected."
        )
        segment_strategy = (
            "The orchestrator prioritizes the object first, then modifiers like attributes and style, before scene context."
        )
        if not segment_profile.style and not segment_profile.environment:
            improvement_tip = "Add a style or environment cue if you want stronger control over presentation and context."
        elif not segment_profile.attributes:
            improvement_tip = "Add one concrete attribute such as color, texture, or scale to increase specificity."
        else:
            improvement_tip = "If you want clearer behavior changes, edit one high-impact segment at a time for cleaner what-if comparisons."

        return PromptExplanationSummary(
            overview=trim_text(overview, 500),
            segment_strategy=trim_text(segment_strategy, 500),
            improvement_tip=trim_text(improvement_tip, 500),
        )

"""Prompt segmentation and explainability logic."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.models.schemas import PromptExplanationSummary, PromptSegment, SegmentChange, TokenImpact
from app.utils.helpers import normalize_scores, tokenize_text, trim_text
from config import Settings

logger = logging.getLogger(__name__)

_CLAUSE_SPLIT_PATTERN = re.compile(r"(?:\n+|[.;:]+|,\s+)")


@dataclass(frozen=True)
class PromptAnalysisResult:
    """Internal structured prompt analysis."""

    segments: list[PromptSegment]
    summary: PromptExplanationSummary
    mapping: list[TokenImpact]


class ExplanationService:
    """Generate prompt segments, effect descriptions, and compact impact mappings."""

    _kind_templates = {
        "subject": "This is the primary subject anchor that determines what the model centers first.",
        "style": "This steers the aesthetic treatment, mood, and finishing choices across the result.",
        "composition": "This shapes layout, framing, or structural arrangement in the generated output.",
        "constraint": "This narrows the search space and makes the result more predictable.",
        "audience": "This reframes the wording or presentation around who the output is meant for.",
        "reference": "This uses the image reference as an anchor, so other segments adapt around it.",
        "output": "This tells the model what artifact to deliver and how explicit the final answer should be.",
        "tone": "This shifts the emotional register and polish of the response.",
        "detail": "This pushes the model toward specificity and richer execution.",
    }

    _kind_keywords = {
        "style": {"cinematic", "editorial", "minimal", "premium", "bright", "dark", "glass", "calm"},
        "composition": {"layout", "hero", "dashboard", "ribbon", "overlay", "side-by-side", "grid", "framing"},
        "constraint": {"only", "avoid", "without", "must", "should", "limit", "constrain"},
        "audience": {"team", "teams", "founder", "customer", "users", "audience"},
        "output": {"write", "design", "generate", "create", "draft", "announcement", "intro"},
        "tone": {"confident", "safe", "clear", "polished", "concise", "launch-ready"},
        "detail": {"detailed", "visible", "mapping", "trust", "comparison", "scoring", "explainability"},
    }

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def analyze_prompt(
        self,
        *,
        prompt: str,
        output: str,
        mode: str,
        reference_image_used: bool = False,
    ) -> PromptAnalysisResult:
        """Return structured prompt analysis for the supplied generation."""
        normalized_prompt = prompt.strip()

        if self.settings.groq_api_key and normalized_prompt:
            try:
                return self._analyze_with_groq(
                    prompt=normalized_prompt,
                    output=output,
                    mode=mode,
                    reference_image_used=reference_image_used,
                )
            except Exception as exc:  # pragma: no cover - provider fallback
                logger.warning("Groq prompt analysis failed, using heuristic segmentation: %s", exc)

        return self._analyze_heuristically(
            prompt=normalized_prompt,
            output=output,
            mode=mode,
            reference_image_used=reference_image_used,
        )

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
                effect = f'The "{after.label}" segment was introduced in variant B, adding a new steering signal.'

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

    def _analyze_with_groq(
        self,
        *,
        prompt: str,
        output: str,
        mode: str,
        reference_image_used: bool,
    ) -> PromptAnalysisResult:
        payload = {
            "model": self.settings.groq_analysis_model,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a prompt analysis engine for an explainable AI product. "
                        "Break prompts into 3 to 6 meaningful segments. "
                        "Return strict JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Mode: {mode}\n"
                        f"Reference image attached: {'yes' if reference_image_used else 'no'}\n"
                        f"Prompt:\n{prompt}\n\n"
                        f"Output context:\n{trim_text(output, 900)}"
                    ),
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "prompt_analysis",
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["overview", "segment_strategy", "improvement_tip", "segments"],
                        "properties": {
                            "overview": {"type": "string"},
                            "segment_strategy": {"type": "string"},
                            "improvement_tip": {"type": "string"},
                            "segments": {
                                "type": "array",
                                "minItems": 3,
                                "maxItems": 6,
                                "items": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["label", "text", "kind", "impact", "effect"],
                                    "properties": {
                                        "label": {"type": "string"},
                                        "text": {"type": "string"},
                                        "kind": {"type": "string"},
                                        "impact": {"type": "number"},
                                        "effect": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

        request = Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {self.settings.groq_api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urlopen(request, timeout=self.settings.groq_timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except HTTPError as exc:  # pragma: no cover - network/provider behavior
            error_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Groq returned HTTP {exc.code}: {error_body}") from exc
        except URLError as exc:  # pragma: no cover - network/provider behavior
            raise RuntimeError(f"Groq request failed: {exc.reason}") from exc

        data = json.loads(body)
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        segments = self._sanitize_segments(parsed.get("segments") or [], mode=mode, reference_image_used=reference_image_used)

        summary = PromptExplanationSummary(
            overview=trim_text(parsed.get("overview") or "This prompt is being read as a small stack of steering instructions.", 500),
            segment_strategy=trim_text(
                parsed.get("segment_strategy") or "The system separates subject, style, and constraints so each one can be explained independently.",
                500,
            ),
            improvement_tip=trim_text(
                parsed.get("improvement_tip") or "Strengthen the most important segment with one concrete constraint.",
                500,
            ),
        )
        return PromptAnalysisResult(
            segments=segments,
            summary=summary,
            mapping=self.build_token_mapping(prompt=prompt, output=output, segments=segments),
        )

    def _analyze_heuristically(
        self,
        *,
        prompt: str,
        output: str,
        mode: str,
        reference_image_used: bool,
    ) -> PromptAnalysisResult:
        clauses = self._extract_clauses(prompt)
        if reference_image_used:
            clauses.append("Use the attached reference image as a visual anchor.")
        if not clauses:
            clauses = ["Reference-image-driven generation" if reference_image_used else "Untitled prompt"]

        raw_scores: list[float] = []
        segment_specs: list[tuple[str, str, str]] = []

        output_tokens = {token.lower() for token in tokenize_text(output)}
        for index, clause in enumerate(clauses[:6]):
            kind = self._classify_clause(clause, index=index)
            label = kind.title() if kind != "detail" else "Detail"
            score = 0.56 - index * 0.06
            score += 0.12 if any(token.lower() in output_tokens for token in tokenize_text(clause)) else 0.0
            score += 0.06 if kind in {"subject", "style", "output"} else 0.0
            raw_scores.append(score)
            segment_specs.append((label, clause, kind))

        normalized = normalize_scores(raw_scores)
        segments = [
            PromptSegment(
                id=f"segment-{index + 1}",
                label=label,
                text=trim_text(text, 240),
                kind=kind,
                impact=round(score, 2),
                effect=self._effect_for(kind=kind, text=text, mode=mode),
            )
            for index, ((label, text, kind), score) in enumerate(zip(segment_specs, normalized))
        ]

        summary = PromptExplanationSummary(
            overview=(
                "Frigate is reading this prompt as a stack of steering instructions rather than one flat sentence."
                if prompt
                else "Frigate is leaning on the reference image as the main anchor and treating the text as secondary guidance."
            ),
            segment_strategy=(
                "The highest-impact segments usually establish the subject, style, and output format first, then constraints narrow the result."
            ),
            improvement_tip=(
                "If you want a cleaner result, tighten the strongest segment with one measurable adjective, layout cue, or explicit constraint."
            ),
        )

        return PromptAnalysisResult(
            segments=segments,
            summary=summary,
            mapping=self.build_token_mapping(prompt=prompt, output=output, segments=segments),
        )

    def _extract_clauses(self, prompt: str) -> list[str]:
        if not prompt:
            return []

        base_clauses = [part.strip(" ,") for part in _CLAUSE_SPLIT_PATTERN.split(prompt) if part.strip(" ,")]
        clauses: list[str] = []

        for clause in base_clauses:
            if len(base_clauses) < 3 and " with " in clause.lower():
                split_parts = [part.strip() for part in re.split(r"\bwith\b", clause, flags=re.IGNORECASE) if part.strip()]
                clauses.extend(split_parts)
            else:
                clauses.append(clause)

        deduped: list[str] = []
        seen: set[str] = set()
        for clause in clauses:
            normalized = clause.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            deduped.append(clause)

        return deduped[:6]

    def _classify_clause(self, clause: str, *, index: int) -> str:
        clause_tokens = {token.lower() for token in tokenize_text(clause)}
        if index == 0:
            return "subject"
        if "reference" in clause_tokens or "attached" in clause_tokens or "image" in clause_tokens:
            return "reference"

        for kind, keywords in self._kind_keywords.items():
            if clause_tokens & keywords:
                return kind

        return "detail"

    def _effect_for(self, *, kind: str, text: str, mode: str) -> str:
        base = self._kind_templates.get(kind, self._kind_templates["detail"])
        if kind == "subject" and mode == "image":
            return f"{base} In image mode, that usually decides the scene or focal object first."
        if kind == "output" and mode == "text":
            return f"{base} In text mode, it also decides whether the model writes a draft, intro, summary, or explanation."
        return base

    def _sanitize_segments(
        self,
        raw_segments: list[dict[str, Any]],
        *,
        mode: str,
        reference_image_used: bool,
    ) -> list[PromptSegment]:
        if not raw_segments:
            return self._analyze_heuristically(
                prompt="",
                output="",
                mode=mode,
                reference_image_used=reference_image_used,
            ).segments

        segments: list[PromptSegment] = []
        for index, item in enumerate(raw_segments[:6]):
            label = trim_text(str(item.get("label") or f"Segment {index + 1}"), 40)
            text = trim_text(str(item.get("text") or item.get("label") or f"Segment {index + 1}"), 240)
            kind = trim_text(str(item.get("kind") or "detail"), 40).lower()
            try:
                impact = float(item.get("impact", 0.65))
            except (TypeError, ValueError):
                impact = 0.65
            impact = max(0.0, min(1.0, impact))
            effect = trim_text(
                str(item.get("effect") or self._effect_for(kind=kind, text=text, mode=mode)),
                320,
            )
            segments.append(
                PromptSegment(
                    id=f"segment-{index + 1}",
                    label=label,
                    text=text,
                    kind=kind,
                    impact=round(impact, 2),
                    effect=effect,
                )
            )

        if reference_image_used and not any(segment.kind == "reference" for segment in segments):
            segments.append(
                PromptSegment(
                    id=f"segment-{len(segments) + 1}",
                    label="Reference",
                    text="Attached reference image",
                    kind="reference",
                    impact=0.64,
                    effect=self._effect_for(kind="reference", text="Attached reference image", mode=mode),
                )
            )

        return segments[:6]

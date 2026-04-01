"""Prompt segmentation with trained, spaCy, and heuristic paths."""

from __future__ import annotations

import logging
import re
from pathlib import Path

from app.schemas import PromptSegmentProfile
from app.utils.helpers import dedupe_preserve_order, tokenize_text, trim_text
from config import Settings

logger = logging.getLogger(__name__)

STYLE_KEYWORDS = {
    "cinematic",
    "editorial",
    "minimal",
    "photorealistic",
    "watercolor",
    "3d",
    "retro",
    "futuristic",
    "vintage",
    "luxury",
    "noir",
    "anime",
    "documentary",
    "dramatic",
    "bright",
    "dark",
    "moody",
    "clean",
    "friendly",
    "professional",
    "formal",
    "casual",
    "playful",
    "warm",
    "confident",
    "concise",
}
LIGHTING_KEYWORDS = {
    "lighting",
    "sunset",
    "sunrise",
    "golden",
    "neon",
    "backlit",
    "soft",
    "dramatic",
    "studio",
    "daylight",
    "night",
}
ATTRIBUTE_KEYWORDS = {
    "short",
    "brief",
    "long",
    "engaging",
    "red",
    "blue",
    "green",
    "gold",
    "silver",
    "small",
    "large",
    "floating",
    "transparent",
    "glossy",
    "matte",
    "sleek",
    "detailed",
    "high-resolution",
}
OUTPUT_KEYWORDS = {
    "email",
    "article",
    "post",
    "caption",
    "headline",
    "summary",
    "message",
    "description",
    "script",
    "proposal",
    "report",
    "bio",
}
ENVIRONMENT_PREFIXES = ("in ", "on ", "at ", "inside ", "outside ", "under ", "against ", "near ", "beside ", "around ", "through ", "across ")
RELATION_PREFIXES = ("with ", "featuring ", "alongside ")


class PromptSegmenter:
    """Extract the main prompt parts from a prompt."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._trained_segmenter = self._load_trained_segmenter(settings.ml_segmenter_model_path)
        self._nlp = self._load_spacy_pipeline()

    def segment(self, prompt: str, *, reference_image_used: bool = False) -> PromptSegmentProfile:
        """Split a prompt into object, detail, style, and context fields."""
        normalized = " ".join((prompt or "").split())
        if not normalized and reference_image_used:
            return PromptSegmentProfile(
                object="reference-guided scene",
                raw_prompt="",
                reference_image_used=True,
            )

        trained_profile: PromptSegmentProfile | None = None
        if self._trained_segmenter is not None and normalized:
            try:
                trained_profile = self._segment_with_trained_model(normalized, reference_image_used=reference_image_used)
            except Exception as exc:  # pragma: no cover - optional model/runtime path
                logger.warning("Trained segmenter failed, using spaCy/heuristic fallback: %s", exc)

        spacy_profile: PromptSegmentProfile | None = None
        if self._nlp is not None and normalized:
            try:
                spacy_profile = self._segment_with_spacy(normalized, reference_image_used=reference_image_used)
            except Exception as exc:  # pragma: no cover - spaCy path depends on local env
                logger.warning("spaCy segmentation failed, using heuristic fallback: %s", exc)

        heuristic_profile = self._segment_heuristically(normalized, reference_image_used=reference_image_used)

        merged = self._merge_profiles(
            prompt=normalized,
            reference_image_used=reference_image_used,
            trained=trained_profile,
            spacy=spacy_profile,
            heuristic=heuristic_profile,
        )
        if merged.object or merged.attributes or merged.style or merged.environment or merged.lighting:
            return merged
        return heuristic_profile

    def _segment_with_spacy(self, prompt: str, *, reference_image_used: bool) -> PromptSegmentProfile:
        doc = self._nlp(prompt)
        noun_chunks = [
            chunk.text.strip(" ,.")
            for chunk in getattr(doc, "noun_chunks", [])
            if chunk.text.strip(" ,.") and chunk.root.pos_ != "PRON"
        ]
        object_candidate = next(
            (chunk for chunk in noun_chunks if any(keyword in chunk.lower() for keyword in OUTPUT_KEYWORDS)),
            noun_chunks[0] if noun_chunks else None,
        )
        object_text = trim_text(object_candidate, 240) if object_candidate else None

        attributes: list[str] = []
        style: list[str] = []
        environment: list[str] = []
        lighting: list[str] = []

        for token in doc:
            lowered = token.text.lower()
            if token.pos_ == "ADJ" and token.dep_ != "punct":
                if lowered in STYLE_KEYWORDS:
                    style.append(token.text)
                else:
                    attributes.append(token.text)
            if lowered in STYLE_KEYWORDS:
                style.append(token.text)
            if lowered in LIGHTING_KEYWORDS:
                lighting.append(token.text)
            if lowered in ATTRIBUTE_KEYWORDS:
                attributes.append(token.text)

        for chunk in noun_chunks[1:]:
            lowered = chunk.lower()
            if lowered.startswith("for ") or lowered.startswith(ENVIRONMENT_PREFIXES) or any(prefix in lowered for prefix in ("background", "scene", "landscape")):
                environment.append(chunk)

        for sentence in doc.sents:
            text = sentence.text.strip()
            lowered = text.lower()
            if any(lowered.startswith(prefix) for prefix in ENVIRONMENT_PREFIXES):
                environment.append(text)
            if lowered.startswith("for "):
                environment.append(text)
            if "style" in lowered:
                style.append(text)
            tone_match = re.search(r"\b(?:keep it|make it|in a|with a)\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+){0,2})", lowered)
            if tone_match:
                style.append(tone_match.group(1))

        audience_match = re.search(r"\bfor\s+([^,.]+)", prompt, flags=re.IGNORECASE)
        if audience_match:
            environment.append(f"for {audience_match.group(1).strip()}")

        return PromptSegmentProfile(
            object=object_text or trim_text(prompt, 240),
            attributes=dedupe_preserve_order(attributes),
            style=dedupe_preserve_order(style),
            environment=dedupe_preserve_order(environment),
            lighting=dedupe_preserve_order(lighting),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    def _segment_heuristically(self, prompt: str, *, reference_image_used: bool) -> PromptSegmentProfile:
        lowered = prompt.lower()
        clauses = [part.strip(" ,.") for part in re.split(r"[.;,\n]+", prompt) if part.strip(" ,.")]
        tokens = tokenize_text(prompt)

        style = [token for token in tokens if token.lower() in STYLE_KEYWORDS]
        lighting = [token for token in tokens if token.lower() in LIGHTING_KEYWORDS]
        attributes = [token for token in tokens if token.lower() in ATTRIBUTE_KEYWORDS]
        environment = [
            clause
            for clause in clauses
            if clause.lower().startswith(ENVIRONMENT_PREFIXES) or "background" in clause.lower()
        ]

        object_text = None
        if clauses:
            preferred_clause = next(
                (clause for clause in clauses if any(keyword in clause.lower() for keyword in OUTPUT_KEYWORDS)),
                clauses[0],
            )
            first_clause = re.sub(r"^(write|create|design|generate|draft|craft|compose)\s+", "", preferred_clause, flags=re.IGNORECASE)
            relation_parts = re.split(r"\b(?:with|featuring|alongside)\b", first_clause, maxsplit=1, flags=re.IGNORECASE)
            if relation_parts:
                first_clause = relation_parts[0].strip(" ,.")
            lowered_first = first_clause.lower()
            for prefix in ("with ", "in ", "on ", "at "):
                if lowered_first.startswith(prefix):
                    first_clause = first_clause[len(prefix) :]
                    break
            object_text = trim_text(first_clause, 240)

        if not object_text and prompt:
            object_text = trim_text(" ".join(tokens[:6]), 240)

        if "style" in lowered:
            style.extend(re.findall(r"([a-zA-Z-]+\s+style)", prompt, flags=re.IGNORECASE))
        style.extend(re.findall(r"\b(?:keep it|make it|in a|with a)\s+([a-zA-Z-]+(?:\s+[a-zA-Z-]+){0,2})", lowered))
        environment.extend([f"for {match.strip()}" for match in re.findall(r"\bfor\s+([^,.]+)", prompt, flags=re.IGNORECASE)])
        environment.extend([
            f"{prefix.strip()} {value.strip()}".strip()
            for prefix, value in re.findall(
                r"\b(around|through|across|inside|outside|near|beside)\s+([^,.]+)",
                prompt,
                flags=re.IGNORECASE,
            )
        ])
        attributes.extend([
            f"with {match.strip()}"
            for match in re.findall(
                r"\bwith\s+([^,.]+?)(?=\s+(?:around|through|across|inside|outside|near|beside|in|on|at)\b|$)",
                prompt,
                flags=re.IGNORECASE,
            )
        ])
        attributes.extend([match.strip() for match in re.findall(r"\b([a-z]+ing)\b", lowered)])

        attribute_phrases = re.findall(r"\b(short|brief|long|engaging|red|blue|green|gold|silver|sleek|glossy|matte|detailed)\b(?:\s+\w+)?", lowered)
        attributes.extend(attribute_phrases)

        return PromptSegmentProfile(
            object=object_text,
            attributes=dedupe_preserve_order(attributes),
            style=dedupe_preserve_order(style),
            environment=dedupe_preserve_order(environment),
            lighting=dedupe_preserve_order(lighting),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    def _segment_with_trained_model(self, prompt: str, *, reference_image_used: bool) -> PromptSegmentProfile:
        predictions = self._trained_segmenter(prompt)
        grouped: dict[str, list[str]] = {
            "OBJECT": [],
            "ATTRIBUTE": [],
            "STYLE": [],
            "ENVIRONMENT": [],
            "LIGHTING": [],
        }
        for item in predictions:
            label = str(item.get("entity_group", "")).replace("B-", "").replace("I-", "").upper()
            word = trim_text(str(item.get("word", "")).replace("##", "").strip(), 120)
            if label in grouped and word:
                grouped[label].append(word)

        object_text = grouped["OBJECT"][0] if grouped["OBJECT"] else trim_text(prompt, 240)
        return PromptSegmentProfile(
            object=object_text,
            attributes=dedupe_preserve_order(grouped["ATTRIBUTE"]),
            style=dedupe_preserve_order(grouped["STYLE"]),
            environment=dedupe_preserve_order(grouped["ENVIRONMENT"]),
            lighting=dedupe_preserve_order(grouped["LIGHTING"]),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    @staticmethod
    def _merge_profiles(
        *,
        prompt: str,
        reference_image_used: bool,
        trained: PromptSegmentProfile | None,
        spacy: PromptSegmentProfile | None,
        heuristic: PromptSegmentProfile,
    ) -> PromptSegmentProfile:
        candidates = [
            profile
            for profile in (trained, spacy, heuristic)
            if profile is not None and not PromptSegmenter._is_low_signal_profile(profile, prompt)
        ]
        if not candidates:
            candidates = [heuristic]

        def score_object(value: str | None) -> tuple[int, int]:
            cleaned = trim_text(value or "", 240)
            token_count = len(tokenize_text(cleaned))
            if not cleaned:
                return (0, 0)
            keyword_bonus = 5 if any(keyword in cleaned.lower() for keyword in OUTPUT_KEYWORDS) else 0
            concise_bonus = max(0, 10 - min(token_count, 10))
            return (keyword_bonus + concise_bonus, -len(cleaned))

        object_text = max(
            (profile.object for profile in candidates),
            key=score_object,
            default=trim_text(prompt, 240),
        )

        return PromptSegmentProfile(
            object=object_text or trim_text(prompt, 240),
            attributes=PromptSegmenter._merge_lists(*(profile.attributes for profile in candidates)),
            style=PromptSegmenter._merge_lists(*(profile.style for profile in candidates)),
            environment=PromptSegmenter._merge_lists(*(profile.environment for profile in candidates)),
            lighting=PromptSegmenter._merge_lists(*(profile.lighting for profile in candidates)),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    @staticmethod
    def _merge_lists(*groups: list[str]) -> list[str]:
        merged: list[str] = []
        for group in groups:
            merged.extend(group)
        return dedupe_preserve_order(merged)

    @staticmethod
    def _is_low_signal_profile(profile: PromptSegmentProfile, prompt: str) -> bool:
        object_text = trim_text(profile.object or "", 240).lower()
        normalized_prompt = trim_text(prompt, 240).lower()
        has_secondary = bool(profile.attributes or profile.style or profile.environment or profile.lighting)
        return not has_secondary and object_text == normalized_prompt

    @staticmethod
    def _load_spacy_pipeline():
        try:  # pragma: no cover - optional dependency
            import spacy
        except Exception:
            return None

        for model_name in ("en_core_web_sm", "en_core_web_md", "en_core_web_lg"):
            try:
                return spacy.load(model_name)
            except Exception:
                continue

        try:
            return spacy.blank("en")
        except Exception:
            return None

    @staticmethod
    def _load_trained_segmenter(model_path: Path):
        if not model_path.exists():
            return None

        try:  # pragma: no cover - optional dependency
            from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline
        except Exception:
            return None

        try:
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForTokenClassification.from_pretrained(model_path)
            return pipeline(
                "token-classification",
                model=model,
                tokenizer=tokenizer,
                aggregation_strategy="simple",
            )
        except Exception as exc:
            logger.warning("Unable to load trained segmenter from %s: %s", model_path, exc)
            return None

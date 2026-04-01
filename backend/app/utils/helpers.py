"""Shared helper functions used across the backend."""

from __future__ import annotations

import base64
import io
import re
from collections import Counter
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Iterable
from urllib.parse import quote, urlencode

from PIL import Image, ImageDraw

TOKEN_PATTERN = re.compile(r"\b[\w'-]+\b")


def tokenize_text(text: str) -> list[str]:
    """Split freeform text into simple tokens."""
    return TOKEN_PATTERN.findall(text or "")


def clamp(value: float, minimum: float, maximum: float) -> float:
    """Clamp a numeric value into the supplied inclusive range."""
    return max(minimum, min(maximum, value))


def normalize_scores(values: Iterable[float]) -> list[float]:
    """Normalize a list of scores into a stable 0.05-1.00 range."""
    scores = list(values)
    if not scores:
        return []

    minimum = min(scores)
    maximum = max(scores)

    if maximum == minimum:
        return [0.75 for _ in scores]

    return [0.05 + ((score - minimum) / (maximum - minimum)) * 0.95 for score in scores]


def summarize_prompt_difference(original_prompt: str, modified_prompt: str) -> str:
    """Create a compact human-readable summary of prompt edits."""
    original_tokens = tokenize_text(original_prompt)
    modified_tokens = tokenize_text(modified_prompt)

    original_counter = Counter(token.lower() for token in original_tokens)
    modified_counter = Counter(token.lower() for token in modified_tokens)

    added = sorted(token for token in modified_counter if modified_counter[token] > original_counter.get(token, 0))
    removed = sorted(token for token in original_counter if original_counter[token] > modified_counter.get(token, 0))
    similarity = SequenceMatcher(a=original_prompt, b=modified_prompt).ratio()

    parts = [f"Prompt similarity is {similarity:.0%}."]
    if added:
        parts.append(f"Added emphasis on: {', '.join(added[:6])}.")
    if removed:
        parts.append(f"Removed emphasis on: {', '.join(removed[:6])}.")
    if not added and not removed:
        parts.append("The prompts differ mostly in phrasing rather than intent.")

    return " ".join(parts)


def estimate_generation_scores(prompt: str, output: str, mode: str) -> tuple[float, float, float]:
    """Estimate confidence-style scores for the UI from prompt/output heuristics."""
    prompt_tokens = tokenize_text(prompt)
    output_tokens = {token.lower() for token in tokenize_text(output)}
    unique_prompt_tokens = {token.lower() for token in prompt_tokens}
    overlap_ratio = (
        len(unique_prompt_tokens & output_tokens) / len(unique_prompt_tokens)
        if unique_prompt_tokens
        else 0.0
    )
    prompt_length_bonus = min(len(prompt.strip()) / 180, 1.0)
    richness_bonus = min(len(unique_prompt_tokens) / 22, 1.0)
    output_length_bonus = min(len(output.strip()) / (220 if mode == "text" else 140), 1.0)

    confidence = 58 + overlap_ratio * 22 + prompt_length_bonus * 12
    clarity = 54 + richness_bonus * 26 + (0.12 if "," in prompt or "." in prompt else 0.0) * 100
    quality = 60 + overlap_ratio * 16 + output_length_bonus * 18 + (4 if mode == "image" else 0)

    return tuple(round(clamp(score, 0.0, 99.0), 2) for score in (confidence, clarity, quality))


def similarity_ratio(left: str, right: str) -> float:
    """Return a stable 0-1 similarity ratio between two strings."""
    return SequenceMatcher(a=left or "", b=right or "").ratio()


def quality_label_from_score(score: float) -> str:
    """Convert a numeric quality score to a short label."""
    if score >= 92:
        return "Excellent"
    if score >= 82:
        return "Good"
    if score >= 70:
        return "Fair"
    return "Needs Work"


def build_pollinations_image_url(
    *,
    prompt: str,
    base_url: str,
    model: str,
    width: int,
    height: int,
    nologo: bool,
) -> str:
    """Build a Pollinations image URL for the supplied prompt."""
    query = urlencode(
        {
            "model": model,
            "width": width,
            "height": height,
            "nologo": "true" if nologo else "false",
        }
    )
    return f"{base_url.rstrip('/')}/{quote(prompt.strip())}?{query}"


def relative_time_from_iso(value: str) -> str:
    """Return a lightweight relative label from an ISO timestamp."""
    created_at = datetime.fromisoformat(value.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    seconds = max(0, int((now - created_at).total_seconds()))

    if seconds < 60:
        return "just now"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    return f"{seconds // 86400}d ago"


def trim_text(text: str, limit: int = 140) -> str:
    """Trim text without breaking the UI with very long strings."""
    normalized = " ".join((text or "").split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def dedupe_preserve_order(values: Iterable[str]) -> list[str]:
    """Return non-empty unique strings in their original order."""
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        cleaned = trim_text(value, 120).strip(" ,.")
        key = cleaned.lower()
        if not cleaned or key in seen:
            continue
        seen.add(key)
        output.append(cleaned)
    return output


def encode_image_to_data_url(image: Image.Image, mime_type: str = "image/png") -> str:
    """Encode a Pillow image into a data URL."""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def decode_data_url_image(data_url: str) -> Image.Image | None:
    """Decode a raster data URL into a Pillow image when possible."""
    if not data_url or not data_url.startswith("data:") or ";base64," not in data_url:
        return None

    header, _, encoded = data_url.partition(",")
    if "image/svg+xml" in header:
        return None

    raw_bytes = base64.b64decode(encoded)
    image = Image.open(io.BytesIO(raw_bytes))
    return image.convert("RGBA")


def build_mock_text_output(prompt: str) -> str:
    """Return a stable sample text response for offline mode."""
    tokens = tokenize_text(prompt)
    focus_terms = ", ".join(tokens[:5]) if tokens else "the requested concept"
    return (
        "Sample response: This draft expands on "
        f"{focus_terms}. It emphasizes clarity, intent, and a user-facing explanation "
        "that can be inspected in the explainability view."
    )


def build_mock_image_output(prompt: str) -> str:
    """Return a lightweight raster mock image that works with the heatmap pipeline."""
    prompt_line = trim_text(prompt.strip() or "Untitled prompt", 72)
    image = Image.new("RGBA", (1280, 768), "#0b1220")
    draw = ImageDraw.Draw(image, "RGBA")

    for index, color in enumerate(("#17324d", "#1f4c7d", "#7fb4ff")):
        inset = 40 + index * 36
        alpha = 85 if index == 0 else 55 if index == 1 else 24
        fill_rgb = tuple(int(color[offset : offset + 2], 16) for offset in (1, 3, 5))
        draw.rounded_rectangle(
            (inset, inset, 1280 - inset, 768 - inset),
            radius=42,
            fill=(*fill_rgb, alpha),
        )

    draw.ellipse((210, 160, 710, 620), fill=(90, 140, 255, 90))
    draw.ellipse((700, 200, 1120, 560), fill=(255, 210, 60, 70))
    draw.rounded_rectangle((96, 86, 1184, 680), radius=34, outline=(255, 255, 255, 70), width=2)
    draw.rounded_rectangle((96, 90, 420, 148), radius=24, fill=(255, 255, 255, 26))
    draw.rounded_rectangle((96, 190, 760, 286), radius=28, fill=(255, 255, 255, 22))
    draw.rounded_rectangle((96, 322, 430, 596), radius=28, fill=(255, 255, 255, 18))
    draw.rounded_rectangle((466, 322, 760, 596), radius=28, fill=(255, 255, 255, 14))
    draw.rounded_rectangle((820, 206, 1130, 596), radius=36, fill=(12, 22, 38, 126))
    draw.line((118, 134, 290, 134), fill=(214, 255, 0, 220), width=6)

    try:
        from PIL import ImageFont

        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
    except Exception:  # pragma: no cover - pillow default font load is stable
        title_font = None
        body_font = None

    draw.text((122, 108), "Sample Image Output", fill=(245, 248, 255, 255), font=title_font)
    draw.text((122, 214), prompt_line, fill=(240, 245, 255, 255), font=body_font)
    draw.text(
        (122, 628),
        "Explainable preview image generated locally for Frigate.",
        fill=(210, 220, 232, 220),
        font=body_font,
    )

    return encode_image_to_data_url(image)

"""Heatmap generation for image outputs."""

from __future__ import annotations

import asyncio

from PIL import Image, ImageDraw

from app.schemas import PromptSegmentProfile
from app.utils.helpers import decode_data_url_image, encode_image_to_data_url
from config import Settings


class HeatmapEngine:
    """Generate a visual heatmap overlay for image outputs."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate_heatmap(
        self,
        *,
        image_data_url: str,
        segment_profile: PromptSegmentProfile,
    ) -> str:
        """Generate a semi-transparent heatmap over the produced image."""
        return await asyncio.to_thread(
            self._build_heatmap,
            image_data_url,
            segment_profile,
        )

    def _build_heatmap(self, image_data_url: str, segment_profile: PromptSegmentProfile) -> str:
        base_image = decode_data_url_image(image_data_url)
        if base_image is None:
            base_image = Image.new(
                "RGBA",
                (self.settings.hf_image_width, self.settings.hf_image_height),
                (18, 27, 43, 255),
            )

        overlay = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        width, height = base_image.size

        if segment_profile.object:
            draw.ellipse(
                (width * 0.22, height * 0.18, width * 0.78, height * 0.86),
                fill=(255, 86, 86, 82),
            )
        if segment_profile.environment:
            draw.rectangle((0, 0, width, height * 0.34), fill=(70, 150, 255, 54))
        if segment_profile.style:
            draw.rounded_rectangle(
                (width * 0.08, height * 0.08, width * 0.92, height * 0.92),
                radius=48,
                outline=(255, 214, 102, 110),
                width=18,
            )
        if segment_profile.attributes:
            box_width = width * 0.18
            for index, _ in enumerate(segment_profile.attributes[:3]):
                left = width * 0.08 + index * (box_width + width * 0.04)
                draw.rounded_rectangle(
                    (left, height * 0.66, left + box_width, height * 0.9),
                    radius=26,
                    fill=(118, 255, 162, 52),
                )
        if segment_profile.lighting:
            draw.rectangle((0, 0, width, height * 0.18), fill=(255, 235, 110, 64))

        combined = Image.alpha_composite(base_image.convert("RGBA"), overlay)
        return encode_image_to_data_url(combined)

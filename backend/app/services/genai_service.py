"""Generation service for Groq text and Hugging Face multimodal/image outputs."""

from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.models.schemas import ReferenceImageInput
from app.utils.helpers import build_mock_image_output, build_mock_text_output, trim_text
from config import Settings

logger = logging.getLogger(__name__)

try:  # pragma: no cover - import behavior depends on local environment
    from huggingface_hub import InferenceClient
except Exception:  # pragma: no cover - defensive optional dependency
    InferenceClient = None  # type: ignore[assignment]


@dataclass(frozen=True)
class ProviderGenerationResult:
    """Normalized provider response payload."""

    output: str
    provider: str
    analysis_text: str


class GenAIService:
    """Wrap real or fallback generation behavior behind a small interface."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._hf_client = None
        if InferenceClient is not None and settings.hf_api_token:
            try:
                self._hf_client = InferenceClient(
                    provider=settings.hf_provider,
                    api_key=settings.hf_api_token,
                )
            except Exception as exc:  # pragma: no cover - defensive client init
                logger.warning("Unable to initialize Hugging Face client: %s", exc)

    async def generate_text(
        self,
        prompt: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> ProviderGenerationResult:
        """Generate text with Groq when configured, otherwise use a deterministic mock."""
        reference_caption = await self._describe_reference_image(reference_image)
        effective_prompt = self._compose_prompt(prompt=prompt, reference_caption=reference_caption, mode="text")

        if not self.settings.groq_api_key:
            fallback = build_mock_text_output(effective_prompt or "reference-image-led draft")
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-text",
                analysis_text=fallback,
            )

        try:
            output = await asyncio.to_thread(self._run_groq_text_generation, effective_prompt)
            return ProviderGenerationResult(
                output=output,
                provider=f"groq:{self.settings.groq_text_model}",
                analysis_text=output,
            )
        except Exception as exc:  # pragma: no cover - defensive provider fallback
            logger.warning("Groq text generation failed, falling back to mock mode: %s", exc)
            fallback = build_mock_text_output(effective_prompt or "reference-image-led draft")
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-text",
                analysis_text=fallback,
            )

    async def generate_image(
        self,
        prompt: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> ProviderGenerationResult:
        """Generate an image through Hugging Face and fall back gracefully when needed."""
        reference_caption = await self._describe_reference_image(reference_image)
        effective_prompt = self._compose_prompt(prompt=prompt, reference_caption=reference_caption, mode="image")

        if self._hf_client is None or not self.settings.hf_api_token:
            fallback = build_mock_image_output(effective_prompt or "Reference-image-led composition")
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-image",
                analysis_text=effective_prompt or "Reference-image-led composition",
            )

        if reference_image is not None:
            try:
                image_data_url = await asyncio.to_thread(self._run_hf_image_to_image, effective_prompt, reference_image)
                return ProviderGenerationResult(
                    output=image_data_url,
                    provider=f"hf-image-to-image:{self.settings.hf_image_to_image_model}",
                    analysis_text=effective_prompt,
                )
            except Exception as exc:  # pragma: no cover - provider/model behavior
                logger.warning("HF image-to-image failed, retrying with text-to-image: %s", exc)

        try:
            image_data_url = await asyncio.to_thread(self._run_hf_text_to_image, effective_prompt)
            return ProviderGenerationResult(
                output=image_data_url,
                provider=f"hf-text-to-image:{self.settings.hf_text_to_image_model}",
                analysis_text=effective_prompt,
            )
        except Exception as exc:  # pragma: no cover - defensive provider fallback
            logger.warning("HF text-to-image failed, falling back to mock mode: %s", exc)
            fallback = build_mock_image_output(effective_prompt or "Reference-image-led composition")
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-image",
                analysis_text=effective_prompt or "Reference-image-led composition",
            )

    def _run_groq_text_generation(self, prompt: str) -> str:
        payload = {
            "model": self.settings.groq_text_model,
            "temperature": 0.5,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are generating polished output for an explainable AI workspace. "
                        "Follow the user's intent closely, keep the result usable, and do not mention hidden analysis."
                    ),
                },
                {"role": "user", "content": prompt or "Generate from the attached reference image."},
            ],
        }
        data = self._post_json(
            "https://api.groq.com/openai/v1/chat/completions",
            payload,
            headers={
                "Authorization": f"Bearer {self.settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            timeout=self.settings.groq_timeout_seconds,
        )
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            return "\n".join(str(item) for item in content).strip()
        return str(content).strip()

    def _run_hf_text_to_image(self, prompt: str) -> str:
        if self._hf_client is None:
            raise RuntimeError("Hugging Face client is unavailable")

        image = self._hf_client.text_to_image(
            prompt or "Generate an image based on the attached visual reference.",
            model=self.settings.hf_text_to_image_model,
            guidance_scale=self.settings.hf_guidance_scale,
            num_inference_steps=self.settings.hf_num_inference_steps,
            width=self.settings.hf_image_width,
            height=self.settings.hf_image_height,
        )
        return self._image_to_data_url(image)

    def _run_hf_image_to_image(self, prompt: str, reference_image: ReferenceImageInput) -> str:
        if self._hf_client is None:
            raise RuntimeError("Hugging Face client is unavailable")

        image_bytes = self._reference_image_to_bytes(reference_image)
        image = self._hf_client.image_to_image(
            image_bytes,
            prompt=prompt or "Use the attached image as the visual starting point.",
            model=self.settings.hf_image_to_image_model,
            guidance_scale=self.settings.hf_guidance_scale,
            num_inference_steps=self.settings.hf_num_inference_steps,
            target_size={
                "width": self.settings.hf_image_width,
                "height": self.settings.hf_image_height,
            },
        )
        return self._image_to_data_url(image)

    async def _describe_reference_image(self, reference_image: ReferenceImageInput | None) -> str | None:
        if reference_image is None or not self.settings.hf_api_token:
            return None

        try:
            return await asyncio.to_thread(self._run_hf_vision_caption, reference_image)
        except Exception as exc:  # pragma: no cover - provider fallback
            logger.warning("HF vision captioning failed: %s", exc)
            return None

    def _run_hf_vision_caption(self, reference_image: ReferenceImageInput) -> str:
        image_url = reference_image.url or reference_image.data_url
        if not image_url:
            raise ValueError("Reference image requires either a url or data_url")

        payload = {
            "model": self.settings.hf_vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Describe the attached image in two concise sentences for a generative AI prompt. "
                                "Focus on subject, visual style, layout, and notable constraints."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                            },
                        },
                    ],
                }
            ],
        }
        data = self._post_json(
            f"{self.settings.hf_router_base_url.rstrip('/')}/chat/completions",
            payload,
            headers={
                "Authorization": f"Bearer {self.settings.hf_api_token}",
                "Content-Type": "application/json",
            },
            timeout=self.settings.groq_timeout_seconds,
        )
        message = data["choices"][0]["message"]["content"]
        if isinstance(message, str):
            return trim_text(message, 420)
        if isinstance(message, list):
            text_parts = [part.get("text", "") for part in message if isinstance(part, dict)]
            return trim_text(" ".join(text_parts), 420)
        return trim_text(str(message), 420)

    @staticmethod
    def _compose_prompt(*, prompt: str, reference_caption: str | None, mode: str) -> str:
        base_prompt = prompt.strip()
        if reference_caption and base_prompt:
            return (
                f"{base_prompt}\n\n"
                f"Reference image guidance: {reference_caption}"
            )
        if reference_caption:
            prefix = "Write output using this visual reference:" if mode == "text" else "Generate an image using this visual reference:"
            return f"{prefix} {reference_caption}"
        return base_prompt

    @staticmethod
    def _reference_image_to_bytes(reference_image: ReferenceImageInput) -> bytes:
        if reference_image.data_url:
            header, _, encoded = reference_image.data_url.partition(",")
            if ";base64" not in header:
                raise ValueError("Reference image data_url must be base64-encoded")
            return base64.b64decode(encoded)

        if reference_image.url:
            request = Request(reference_image.url, method="GET")
            try:
                with urlopen(request, timeout=30) as response:
                    return response.read()
            except HTTPError as exc:  # pragma: no cover - network/provider behavior
                raise RuntimeError(f"Reference image download returned HTTP {exc.code}") from exc
            except URLError as exc:  # pragma: no cover - network/provider behavior
                raise RuntimeError(f"Reference image download failed: {exc.reason}") from exc

        raise ValueError("Reference image requires either a data_url or a url")

    @staticmethod
    def _image_to_data_url(image: Any) -> str:
        if hasattr(image, "save"):
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
        if isinstance(image, bytes):
            encoded = base64.b64encode(image).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
        raise TypeError("Unsupported image response from Hugging Face client")

    @staticmethod
    def _post_json(url: str, payload: dict[str, Any], *, headers: dict[str, str], timeout: int) -> dict[str, Any]:
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers=headers,
        )

        try:
            with urlopen(request, timeout=timeout) as response:
                body = response.read().decode("utf-8")
        except HTTPError as exc:  # pragma: no cover - network/provider behavior
            error_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Provider returned HTTP {exc.code}: {error_body}") from exc
        except URLError as exc:  # pragma: no cover - network/provider behavior
            raise RuntimeError(f"Provider request failed: {exc.reason}") from exc

        return json.loads(body)

    async def close(self) -> None:
        """Expose a consistent shutdown hook for the app lifespan."""
        return None

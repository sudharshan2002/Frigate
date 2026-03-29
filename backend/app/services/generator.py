"""Handles calling our AI models for both words and pictures."""

from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
from datetime import datetime, timezone
from dataclasses import dataclass
from time import perf_counter
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.schemas.api import ReferenceImageInput, GenerateResponse, PromptExplanationSummary, SessionRecord, TokenImpact, GeneratedArtifacts
from app.utils.helpers import build_mock_image_output, build_mock_text_output, trim_text
from config import Settings

logger = logging.getLogger(__name__)

try:  # pragma: no cover
    from app.services.nlp_analyzer import NLPAnalyzer
except Exception:  # pragma: no cover
    NLPAnalyzer = None  # type: ignore[assignment]

try:  # pragma: no cover
    from huggingface_hub import InferenceClient
except Exception:  # pragma: no cover
    InferenceClient = None  # type: ignore[assignment]


@dataclass(frozen=True)
class ProviderGenerationResult:
    """Standardized chunk of data we get back when a model finishes."""

    output: str
    provider: str
    analysis_text: str
    latency_ms: float


@dataclass(frozen=True)
class MultimodalGenerationResult:
    """Holds both text and image results together."""

    text: ProviderGenerationResult
    image: ProviderGenerationResult

    @property
    def providers(self) -> dict[str, str]:
        return {"text": self.text.provider, "image": self.image.provider}

    @classmethod
    def from_single_mode(
        cls,
        *,
        mode: str,
        result: ProviderGenerationResult,
    ) -> "MultimodalGenerationResult":
        skipped_text = ProviderGenerationResult(
            output="",
            provider="skipped-text",
            analysis_text="",
            latency_ms=0.0,
        )
        skipped_image = ProviderGenerationResult(
            output="",
            provider="skipped-image",
            analysis_text="",
            latency_ms=0.0,
        )
        if mode == "image":
            return cls(text=skipped_text, image=result)
        return cls(text=result, image=skipped_image)


class GenerationEngine:
    """Main class to run requests and handle falling back to other providers if one fails."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._hf_client = None
        self.nlp_analyzer = NLPAnalyzer() if NLPAnalyzer is not None else None
        if InferenceClient is not None and settings.hf_api_token:
            try:
                self._hf_client = InferenceClient(
                    api_key=settings.hf_api_token,
                )
            except Exception as exc:  # pragma: no cover - defensive client init
                logger.warning("Unable to initialize Hugging Face client: %s", exc)

    async def generate_multimodal(
        self,
        prompt: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> MultimodalGenerationResult:
        """Run text and image tasks at the same time."""
        text_result, image_result = await asyncio.gather(
            self.generate_text(prompt, reference_image),
            self.generate_image(prompt, reference_image),
        )
        return MultimodalGenerationResult(text=text_result, image=image_result)

    async def generate_mode_bundle(
        self,
        *,
        prompt: str,
        mode: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> MultimodalGenerationResult:
        """Focus on just one type of output and package it nicely."""
        result = await self.generate_for_mode(
            prompt=prompt,
            mode=mode,
            reference_image=reference_image,
        )
        return MultimodalGenerationResult.from_single_mode(mode=mode, result=result)

    async def generate_for_mode(
        self,
        *,
        prompt: str,
        mode: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> ProviderGenerationResult:
        """Figure out which type we are doing and run just that."""
        if mode == "image":
            return await self.generate_image(prompt, reference_image)
        return await self.generate_text(prompt, reference_image)

    async def generate_text(
        self,
        prompt: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> ProviderGenerationResult:
        """Try our main provider for text, and fall back down the list if it breaks."""
        started_at = perf_counter()
        reference_caption = await self._describe_reference_image(reference_image)
        effective_prompt = self._compose_prompt(prompt=prompt, reference_caption=reference_caption, mode="text")

        output = ""
        provider_id = ""

        # 1. Primary: Hugging Face (Qwen)
        if self._hf_client is not None:
            try:
                output = await asyncio.to_thread(self._run_hf_chat_completion, effective_prompt or "reference-image-led draft")
                provider_id = "hf-chat:Qwen/Qwen2.5-7B-Instruct"
            except Exception as exc:  # pragma: no cover
                logger.warning("HF chat completion failed, trying Pollinations: %s", exc)

        # 2. Secondary: Pollinations (Free, reliable)
        if not output:
            try:
                output = await asyncio.to_thread(self._run_pollinations_text_generation, effective_prompt)
                provider_id = "pollinations-text"
            except Exception as exc:  # pragma: no cover
                logger.warning("Pollinations text generation failed, trying Groq: %s", exc)

        # 3. Tertiary: Groq
        if not output and self.settings.groq_api_key:
            try:
                output = await asyncio.to_thread(self._run_groq_text_generation, effective_prompt)
                provider_id = f"groq:{self.settings.groq_text_model}"
            except Exception as exc:  # pragma: no cover
                logger.warning("Groq text generation failed, falling back to mock: %s", exc)

        # 4. Final: Mock
        if not output:
            output = build_mock_text_output(effective_prompt or "reference-image-led draft")
            provider_id = "mock-text"

        return ProviderGenerationResult(
            output=output,
            provider=provider_id,
            analysis_text=effective_prompt,
            latency_ms=round((perf_counter() - started_at) * 1000, 2),
        )

    async def generate_image(
        self,
        prompt: str,
        reference_image: ReferenceImageInput | None = None,
    ) -> ProviderGenerationResult:
        """Try making an image, falling back through our providers if one fails."""
        started_at = perf_counter()
        reference_caption = await self._describe_reference_image(reference_image)
        effective_prompt = self._compose_prompt(prompt=prompt, reference_caption=reference_caption, mode="image")

        output = ""
        provider_id = ""

        # 1. Primary: Hugging Face (Schnell is primary in settings now)
        if self._hf_client is not None and self.settings.hf_api_token:
            if reference_image is not None:
                try:
                    output = await asyncio.to_thread(self._run_hf_image_to_image, effective_prompt, reference_image)
                    provider_id = f"hf-image-to-image:{self.settings.hf_image_to_image_model}"
                except Exception as exc:  # pragma: no cover
                    logger.warning("HF image-to-image failed, trying text-to-image: %s", exc)

            if not output:
                try:
                    output = await asyncio.to_thread(self._run_hf_text_to_image, effective_prompt)
                    provider_id = f"hf-text-to-image:{self.settings.hf_text_to_image_model}"
                except Exception as exc:  # pragma: no cover
                    logger.warning("HF primary text-to-image failed, trying Pollinations: %s", exc)

        # 2. Secondary: Pollinations (Free, reliable Flux)
        if not output:
            try:
                output = await asyncio.to_thread(self._run_pollinations_image_generation, effective_prompt)
                provider_id = "pollinations-image:flux"
            except Exception as exc:  # pragma: no cover
                logger.warning("Pollinations image generation failed, falling back to mock: %s", exc)

        # 3. Final: Mock
        if not output:
            output = build_mock_image_output(effective_prompt or "Reference-image-led composition")
            provider_id = "mock-image"

        return ProviderGenerationResult(
            output=output,
            provider=provider_id,
            analysis_text=effective_prompt or "Reference-image-led composition",
            latency_ms=round((perf_counter() - started_at) * 1000, 2),
        )

    def _run_pollinations_text_generation(self, prompt: str) -> str:
        """Hit the Pollinations free text API and give back the raw result."""
        payload = {
            "model": "openai",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an AI prompt engineer generating polished output for 'Frigate', a premium explainable AI workspace. "
                        "Your goal is to provide a structured, professional response in Markdown format. "
                        "Always include the following sections:\n"
                        "### Response Analysis\n"
                        "Briefly evaluate the prompt's intent, clarity, and potential risks.\n\n"
                        "### Refined Proposal\n"
                        "Provide a high-quality, polished version of the user's request.\n"
                        "Keep the tone analytical, concise, and professional."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
        }
        
        # Pollinations text API typically returns raw text directly
        return self._post_raw_text(
            "https://text.pollinations.ai/",
            payload,
            headers={"Content-Type": "application/json"},
            timeout=45,
        )

    def _run_pollinations_image_generation(self, prompt: str) -> str:
        """Fetch a generated image from Pollinations and package it as base64."""
        from urllib.parse import quote as url_quote
        from urllib.request import urlopen, Request as UrlRequest

        encoded_prompt = url_quote(prompt[:500], safe="")
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=768&model=flux&nologo=true"
        req = UrlRequest(url, method="GET", headers={"User-Agent": "Frigate/1.0"})
        with urlopen(req, timeout=60) as response:
            image_bytes = response.read()
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{encoded}"

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

    def _run_hf_chat_completion(self, prompt: str) -> str:
        """Get some text out of HuggingFace's Qwen model."""
        if self._hf_client is None:
            raise RuntimeError("Hugging Face client is unavailable")

        result = self._hf_client.chat_completion(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI prompt engineer generating polished output for 'Frigate', a premium explainable AI workspace. "
                        "Your goal is to provide a structured, professional response in Markdown format. "
                        "Always include the following sections:\n"
                        "### Response Analysis\n"
                        "Briefly evaluate the prompt's intent, clarity, and potential risks.\n\n"
                        "### Refined Proposal\n"
                        "Provide a high-quality, polished version of the user's request.\n\n"
                        "### Deployment Readiness\n"
                        "Rate the prompt from 0-100% for production readiness and explain why.\n\n"
                        "Keep the tone analytical, concise, and professional."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
            temperature=0.7,
        )
        content = result.choices[0].message.content
        if isinstance(content, str):
            return content.strip()
        return str(content).strip()

    def _run_hf_text_to_image_with_model(self, prompt: str, model: str) -> str:
        """Ask HuggingFace to make an image with a specific model string."""
        if self._hf_client is None:
            raise RuntimeError("Hugging Face client is unavailable")

        image = self._hf_client.text_to_image(
            prompt or "Generate an image based on the attached visual reference.",
            model=model,
            width=self.settings.hf_image_width,
            height=self.settings.hf_image_height,
        )
        return self._image_to_data_url(image)

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
            return f"{base_prompt}\n\nReference image guidance: {reference_caption}"
        if reference_caption:
            prefix = (
                "Write output using this visual reference:"
                if mode == "text"
                else "Generate an image using this visual reference:"
            )
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

    @staticmethod
    def _post_raw_text(url: str, payload: dict[str, Any], *, headers: dict[str, str], timeout: int) -> str:
        """Send JSON up to a provider and wait to get regular text back."""
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers=headers,
        )

        try:
            with urlopen(request, timeout=timeout) as response:
                body = response.read().decode("utf-8")
                return body.strip()
        except HTTPError as exc:  # pragma: no cover
            error_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Text Provider returned HTTP {exc.code}: {error_body}") from exc
        except URLError as exc:  # pragma: no cover
            raise RuntimeError(f"Text Provider request failed: {exc.reason}") from exc

    async def close(self) -> None:
        """Clean up when everything shuts down."""
        return None

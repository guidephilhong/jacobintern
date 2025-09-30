"""
llm_client.py: Gemini client wrapper for uploading video and generating structured output.
"""

import mimetypes
import os
import time
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai


@dataclass(frozen=True)
class GeminiConfig:
    model: str
    api_key: str
    temperature: float = 0.2
    max_output_tokens: int = 8192
    request_timeout: int = 600


class GeminiClient:
    def __init__(self, cfg: GeminiConfig) -> None:
        if not cfg.api_key:
            raise ValueError("Missing GOOGLE_API_KEY")
        genai.configure(api_key=cfg.api_key)
        self._cfg = cfg
        self._model = genai.GenerativeModel(
            model_name=cfg.model,
            generation_config={
                "temperature": cfg.temperature,
                "max_output_tokens": cfg.max_output_tokens,
                "response_mime_type": "text/plain",
            },
        )

    def generate_from_video(self, video_path: str, prompt: str) -> str:
        self._validate_video_path(video_path)
        uploaded = self._upload(video_path)
        self._wait_for_active(uploaded)
        response = self._model.generate_content([prompt, uploaded])
        text = getattr(response, "text", None)
        if not text or not text.strip():
            raise RuntimeError("Empty response from model")
        return text.strip()

    def _validate_video_path(self, path: str) -> None:
        if not os.path.isfile(path):
            raise FileNotFoundError(f"File not found: {path}")
        mime, _ = mimetypes.guess_type(path)
        if not mime or not mime.startswith("video/"):
            raise ValueError("Input must be a video file")

    def _upload(self, path: str):
        return genai.upload_file(path=path)

    def _wait_for_active(self, uploaded, interval: float = 2.0) -> None:
        start = time.time()
        while True:
            f = genai.get_file(uploaded.name)
            if f.state.name == "ACTIVE":
                return
            if f.state.name == "FAILED":
                raise RuntimeError("Video processing failed")
            if time.time() - start > self._cfg.request_timeout:
                raise TimeoutError("Timed out waiting for video processing")
            time.sleep(interval)

"""
llm_client.py: Gemini client wrapper for uploading video and generating structured output.
"""

import mimetypes
import os
import time
from dataclasses import dataclass
from typing import Optional

from google import genai
from google.genai.types import Tool, GenerateContentConfig, HttpOptions, UrlContext

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
        self.client = genai.Client(http_options=HttpOptions(api_version="v1"))
        self._cfg = cfg
        # self._model = genai.GenerativeModel(
        #     model_name=cfg.model,
        #     generation_config={
        #         "temperature": cfg.temperature,
        #         "max_output_tokens": cfg.max_output_tokens,
        #         "response_mime_type": "text/plain",
        #     },
        # )

    def generate_from_video(self, video_path: str, prompt: str) -> str:
        # No video_path given
        if video_path is None:
            # Generate with just the text prompt, no video. Enable it to use url context.
            # url_context_tool = Tool(
            #     url_context=UrlContext()
            # )
            tools = []
            tools.append(Tool(url_context=UrlContext()))
            response = self.client.models.generate_content(
                model=self._cfg.model,
                contents=prompt,
                config = GenerateContentConfig(
                    tools = tools,
                ),
                # tools = [url_context_tool],
            )

            # print(response)
            # text = getattr(response, "text", None)
            # if not text or not text.strip():
            #     raise RuntimeError("Empty response from model")
            # return text.strip()

        print("Attempting to use video input. Currently disabled.")
        # TODO
    

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

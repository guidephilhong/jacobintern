"""
vid2workflow.py: A single endpoint function that converts a video into a Guide
AI workflow prompt.
"""

from llm_client import GeminiClient, GeminiConfig
from prompt_builder import TASK_RECORDER_PROMPT, build_guide_ai_system_prompt


def vid2workflow(
    video_path: str,
    model: str,
    api_key: str,
    temperature: float = 0.2,
    max_output_tokens: int = 8192,
    timeout_seconds: int = 600,
) -> str:
    cfg = GeminiConfig(
        model=model,
        api_key=api_key,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        request_timeout=timeout_seconds,
    )
    client = GeminiClient(cfg)
    html = client.generate_from_video(video_path, TASK_RECORDER_PROMPT)
    return build_guide_ai_system_prompt(html)

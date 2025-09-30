#!/usr/bin/env python
"""
main.py: CLI that calls the vid2workflow endpoint (only for testing).
"""

import argparse
import os
import sys
from dotenv import load_dotenv

from vid2workflow import vid2workflow

load_dotenv()

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--video", required=True, help="Path to the input tutorial video file"
    )
    parser.add_argument(
        "--model", default=os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")
    )
    parser.add_argument("--api-key", default=os.environ.get("GOOGLE_API_KEY", ""))
    parser.add_argument(
        "--temperature",
        type=float,
        default=float(os.environ.get("GEN_TEMPERATURE", "0.2")),
    )
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        default=int(os.environ.get("GEN_MAX_TOKENS", "8192")),
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=int(os.environ.get("GEN_TIMEOUT_SECONDS", "600")),
    )

    args = parser.parse_args()

    final_prompt = vid2workflow(
        video_path=args.video,
        model=args.model,
        api_key=args.api_key,
        temperature=args.temperature,
        max_output_tokens=args.max_output_tokens,
        timeout_seconds=args.timeout_seconds,
    )
    print(final_prompt)


if __name__ == "__main__":
    main()

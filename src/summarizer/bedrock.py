"""Optional Bedrock summarizer with graceful fallback behavior."""

from __future__ import annotations

import json
import os

import boto3


DEFAULT_BEDROCK_INFERENCE_PROFILE = "us.anthropic.claude-opus-4-6-v1"


def resolve_bedrock_model_identifier() -> str:
    # Backward-compatible override wins when explicitly set.
    direct_model = os.getenv("BEDROCK_MODEL_ID", "").strip()
    if direct_model:
        return direct_model

    # Preferred path: invoke through inference profile (required for some Anthropic models).
    profile_id = os.getenv("BEDROCK_INFERENCE_PROFILE_ID", "").strip()
    if profile_id:
        return profile_id

    return DEFAULT_BEDROCK_INFERENCE_PROFILE


def summarize_with_bedrock(text: str, max_chars: int = 800) -> str:
    model_id = resolve_bedrock_model_identifier()
    prompt = (
        "Summarize the following evidence in <= "
        f"{max_chars} characters. Focus on actionable facts.\n\n{text}"
    )
    client = boto3.client("bedrock-runtime")
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 256,
                "temperature": 0,
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": prompt}],
                    }
                ],
            }
        ),
    )
    payload = json.loads(response["body"].read().decode("utf-8"))
    chunks = payload.get("content", [])
    text_out = "".join(chunk.get("text", "") for chunk in chunks if isinstance(chunk, dict))
    return text_out[:max_chars]

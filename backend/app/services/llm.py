"""Unified LLM service — provider-agnostic abstraction layer.

Supports two provider modes via LLM_PROVIDER env var:
- "openai-compatible" (default): Works with OpenAI, Gemini, DeepSeek, Mistral,
  vLLM, Ollama, and any OpenAI-compatible endpoint.
- "anthropic": Uses the Anthropic SDK for Claude models.
"""

import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_openai_client = None
_anthropic_client = None


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI

        _openai_client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
    return _openai_client


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import AsyncAnthropic

        _anthropic_client = AsyncAnthropic(api_key=settings.LLM_API_KEY)
    return _anthropic_client


async def generate_text(prompt: str, system_instruction: str = "") -> str:
    """Generate free-form text from a prompt."""
    if settings.LLM_PROVIDER == "anthropic":
        return await _generate_text_anthropic(prompt, system_instruction)
    return await _generate_text_openai(prompt, system_instruction)


async def generate_json(prompt: str, system_instruction: str = "") -> list | dict:
    """Generate structured JSON output from a prompt.

    Attempts JSON mode where supported, falls back to prompt-based parsing.
    Returns parsed dict or list. Returns [] on failure.
    """
    if settings.LLM_PROVIDER == "anthropic":
        raw = await _generate_text_anthropic(prompt, system_instruction)
    else:
        raw = await _generate_text_openai_json(prompt, system_instruction)
    return _parse_json(raw)


# --- OpenAI-compatible backend ---


async def _generate_text_openai(prompt: str, system_instruction: str = "") -> str:
    client = _get_openai_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content or ""


async def _generate_text_openai_json(prompt: str, system_instruction: str = "") -> str:
    client = _get_openai_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or ""
    except Exception:
        # Fallback: some endpoints don't support response_format
        logger.debug("JSON mode not supported, falling back to plain generation")
        return await _generate_text_openai(prompt, system_instruction)


# --- Anthropic backend ---


async def _generate_text_anthropic(prompt: str, system_instruction: str = "") -> str:
    client = _get_anthropic_client()
    kwargs = {
        "model": settings.LLM_MODEL,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system_instruction:
        kwargs["system"] = system_instruction
    response = await client.messages.create(**kwargs)
    return response.content[0].text


# --- JSON parsing helper ---


def _parse_json(raw: str) -> list | dict:
    """Robustly parse JSON from LLM output, stripping markdown fences."""
    cleaned = raw.strip()
    # Strip markdown code fences
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON output: %s", cleaned[:200])
        return []

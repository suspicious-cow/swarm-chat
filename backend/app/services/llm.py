"""Unified LLM service — provider-agnostic abstraction layer.

Supports five provider modes via LLM_PROVIDER env var:
- "gemini" (default): Native Google GenAI SDK.
- "openai": Native OpenAI SDK.
- "anthropic": Native Anthropic SDK for Claude models.
- "mistral": Native Mistral SDK.
- "openai-compatible": OpenAI SDK with custom base_url (DeepSeek, Ollama, vLLM, etc.)
"""

import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_gemini_client = None
_openai_client = None
_openai_compat_client = None
_anthropic_client = None
_mistral_client = None


# --- Client singletons ---


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        from google import genai

        _gemini_client = genai.Client(api_key=settings.LLM_API_KEY)
    return _gemini_client


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI

        _openai_client = AsyncOpenAI(api_key=settings.LLM_API_KEY)
    return _openai_client


def _get_openai_compat_client():
    global _openai_compat_client
    if _openai_compat_client is None:
        from openai import AsyncOpenAI

        _openai_compat_client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
    return _openai_compat_client


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import AsyncAnthropic

        _anthropic_client = AsyncAnthropic(api_key=settings.LLM_API_KEY)
    return _anthropic_client


def _get_mistral_client():
    global _mistral_client
    if _mistral_client is None:
        from mistralai import Mistral

        _mistral_client = Mistral(api_key=settings.LLM_API_KEY)
    return _mistral_client


# --- Public API ---


async def generate_text(prompt: str, system_instruction: str = "") -> str:
    """Generate free-form text from a prompt."""
    match settings.LLM_PROVIDER:
        case "gemini":
            return await _generate_text_gemini(prompt, system_instruction)
        case "openai":
            return await _generate_text_openai(prompt, system_instruction)
        case "anthropic":
            return await _generate_text_anthropic(prompt, system_instruction)
        case "mistral":
            return await _generate_text_mistral(prompt, system_instruction)
        case "openai-compatible":
            return await _generate_text_openai_compat(prompt, system_instruction)
        case _:
            raise ValueError(f"Unknown LLM_PROVIDER: {settings.LLM_PROVIDER}")


async def generate_json(prompt: str, system_instruction: str = "") -> list | dict:
    """Generate structured JSON output from a prompt.

    Uses native JSON mode where supported, falls back to prompt-based parsing.
    Returns parsed dict or list. Returns [] on failure.
    """
    match settings.LLM_PROVIDER:
        case "gemini":
            raw = await _generate_json_gemini(prompt, system_instruction)
        case "openai":
            raw = await _generate_json_openai(prompt, system_instruction)
        case "anthropic":
            raw = await _generate_text_anthropic(prompt, system_instruction)
        case "mistral":
            raw = await _generate_json_mistral(prompt, system_instruction)
        case "openai-compatible":
            raw = await _generate_json_openai_compat(prompt, system_instruction)
        case _:
            raise ValueError(f"Unknown LLM_PROVIDER: {settings.LLM_PROVIDER}")
    return _parse_json(raw)


# --- Gemini backend ---


async def _generate_text_gemini(prompt: str, system_instruction: str = "") -> str:
    from google.genai.types import GenerateContentConfig

    client = _get_gemini_client()
    config = GenerateContentConfig(system_instruction=system_instruction) if system_instruction else None
    response = await client.aio.models.generate_content(
        model=settings.LLM_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text or ""


async def _generate_json_gemini(prompt: str, system_instruction: str = "") -> str:
    from google.genai.types import GenerateContentConfig

    client = _get_gemini_client()
    config = GenerateContentConfig(
        response_mime_type="application/json",
        system_instruction=system_instruction or None,
    )
    response = await client.aio.models.generate_content(
        model=settings.LLM_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text or ""


# --- OpenAI backend ---


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


async def _generate_json_openai(prompt: str, system_instruction: str = "") -> str:
    client = _get_openai_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


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


# --- Mistral backend ---


async def _generate_text_mistral(prompt: str, system_instruction: str = "") -> str:
    client = _get_mistral_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.complete_async(
        model=settings.LLM_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content or ""


async def _generate_json_mistral(prompt: str, system_instruction: str = "") -> str:
    client = _get_mistral_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.complete_async(
        model=settings.LLM_MODEL,
        messages=messages,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


# --- OpenAI-compatible backend ---


async def _generate_text_openai_compat(prompt: str, system_instruction: str = "") -> str:
    client = _get_openai_compat_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content or ""


async def _generate_json_openai_compat(prompt: str, system_instruction: str = "") -> str:
    client = _get_openai_compat_client()
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
        logger.debug("JSON mode not supported, falling back to plain generation")
        return await _generate_text_openai_compat(prompt, system_instruction)


# --- JSON parsing helper ---


def _parse_json(raw: str) -> list | dict:
    """Robustly parse JSON from LLM output, stripping markdown fences."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON output: %s", cleaned[:200])
        return []

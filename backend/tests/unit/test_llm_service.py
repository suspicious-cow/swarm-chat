"""Tests for app.services.llm — provider dispatch, JSON parsing, singletons."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import app.services.llm as llm

# Save originals at import time (before autouse mocks patch them during tests)
_original_generate_text = llm.generate_text
_original_generate_json = llm.generate_json


class TestParseJson:
    """Tests for _parse_json helper."""

    def test_clean_json_array(self):
        raw = '[{"summary": "idea", "sentiment": 0.5}]'
        assert llm._parse_json(raw) == [{"summary": "idea", "sentiment": 0.5}]

    def test_clean_json_object(self):
        raw = '{"key": "value"}'
        assert llm._parse_json(raw) == {"key": "value"}

    def test_markdown_fenced_json(self):
        raw = '```json\n[{"summary": "idea"}]\n```'
        assert llm._parse_json(raw) == [{"summary": "idea"}]

    def test_markdown_fenced_no_lang(self):
        raw = '```\n{"key": "val"}\n```'
        assert llm._parse_json(raw) == {"key": "val"}

    def test_invalid_json_returns_empty_list(self):
        assert llm._parse_json("not json at all") == []

    def test_empty_string_returns_empty_list(self):
        assert llm._parse_json("") == []

    def test_whitespace_padded(self):
        raw = '  \n  [1, 2, 3]  \n  '
        assert llm._parse_json(raw) == [1, 2, 3]


class TestGenerateTextDispatch:
    """Verify generate_text dispatches to the correct backend."""

    @pytest.fixture(autouse=True)
    def _reset_singletons(self):
        """Reset cached client singletons between tests."""
        llm._gemini_client = None
        llm._openai_client = None
        llm._openai_compat_client = None
        llm._anthropic_client = None
        llm._mistral_client = None

    async def test_gemini_dispatch(self, monkeypatch):
        # Restore real dispatch function (undo autouse mock)
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="gemini response")
        monkeypatch.setattr(llm, "_generate_text_gemini", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "gemini")
        result = await llm.generate_text("hello")
        mock.assert_awaited_once_with("hello", "")
        assert result == "gemini response"

    async def test_openai_dispatch(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="openai response")
        monkeypatch.setattr(llm, "_generate_text_openai", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "openai")
        result = await llm.generate_text("hello")
        mock.assert_awaited_once_with("hello", "")
        assert result == "openai response"

    async def test_anthropic_dispatch(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="anthropic response")
        monkeypatch.setattr(llm, "_generate_text_anthropic", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "anthropic")
        result = await llm.generate_text("hello")
        mock.assert_awaited_once_with("hello", "")
        assert result == "anthropic response"

    async def test_mistral_dispatch(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="mistral response")
        monkeypatch.setattr(llm, "_generate_text_mistral", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "mistral")
        result = await llm.generate_text("hello")
        mock.assert_awaited_once_with("hello", "")
        assert result == "mistral response"

    async def test_openai_compatible_dispatch(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="compat response")
        monkeypatch.setattr(llm, "_generate_text_openai_compat", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "openai-compatible")
        result = await llm.generate_text("hello")
        mock.assert_awaited_once_with("hello", "")
        assert result == "compat response"

    async def test_unknown_provider_raises(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "unknown")
        with pytest.raises(ValueError, match="Unknown LLM_PROVIDER"):
            await llm.generate_text("hello")

    async def test_system_instruction_forwarded(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_text", _original_generate_text)
        mock = AsyncMock(return_value="ok")
        monkeypatch.setattr(llm, "_generate_text_gemini", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "gemini")
        await llm.generate_text("prompt", system_instruction="be helpful")
        mock.assert_awaited_once_with("prompt", "be helpful")


class TestGenerateJsonDispatch:
    """Verify generate_json dispatches correctly and parses output."""

    async def test_gemini_json_dispatch(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_json", _original_generate_json)
        mock = AsyncMock(return_value='[{"key": "val"}]')
        monkeypatch.setattr(llm, "_generate_json_gemini", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "gemini")
        result = await llm.generate_json("prompt")
        assert result == [{"key": "val"}]

    async def test_anthropic_uses_text_then_parse(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_json", _original_generate_json)
        mock = AsyncMock(return_value='[{"a": 1}]')
        monkeypatch.setattr(llm, "_generate_text_anthropic", mock)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "anthropic")
        result = await llm.generate_json("prompt")
        assert result == [{"a": 1}]

    async def test_unknown_provider_raises(self, monkeypatch):
        monkeypatch.setattr(llm, "generate_json", _original_generate_json)
        monkeypatch.setattr("app.config.settings.LLM_PROVIDER", "bad")
        with pytest.raises(ValueError, match="Unknown LLM_PROVIDER"):
            await llm.generate_json("prompt")


class TestClientSingletons:
    """Verify client getter functions reuse singletons."""

    def test_gemini_singleton(self, monkeypatch):
        llm._gemini_client = None
        mock_genai = MagicMock()
        mock_client = MagicMock()
        mock_genai.Client.return_value = mock_client
        monkeypatch.setattr("app.config.settings.LLM_API_KEY", "test-key")
        with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": mock_genai}):
            llm._gemini_client = None
            first = llm._get_gemini_client()
            second = llm._get_gemini_client()
            assert first is second

    def test_openai_singleton(self, monkeypatch):
        llm._openai_client = None
        mock_openai = MagicMock()
        monkeypatch.setattr("app.config.settings.LLM_API_KEY", "test-key")
        with patch.dict("sys.modules", {"openai": mock_openai}):
            llm._openai_client = None
            first = llm._get_openai_client()
            second = llm._get_openai_client()
            assert first is second

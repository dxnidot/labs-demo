"""Pruebas del catalogo por roles y los fallbacks del router LiteLLM.

Autor: Daniel
Desde: 2026-10-01
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
import asyncio
import logging

from google.genai import types
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from litellm.exceptions import AuthenticationError

from orquestador import model_router


def test_catalogue_limits_models_by_role() -> None:
    """Unknown roles get only the safe default; advanced gets both tiers."""
    basic = model_router.get_allowed_models({"llm_basic"})
    advanced = model_router.get_allowed_models({"llm_advanced"})
    unknown = model_router.get_allowed_models({"unrecognized"})

    assert {model.tier for model in basic} == {"basic"}
    assert {model.tier for model in advanced} == {"basic", "advanced"}
    assert tuple(model.model_id for model in unknown) == (model_router.DEFAULT_MODEL,)


def test_model_preference_cannot_escape_the_authorized_catalog() -> None:
    """An unpermitted requested model is excluded from fallback candidates."""
    context = model_router.ModelContext(
        subject="user-test",
        roles=frozenset({"llm_basic"}),
        preferred_model="deepseek/deepseek-v4-pro",
    )

    candidates = model_router.get_model_candidates(context)

    assert candidates[0] == model_router.DEFAULT_MODEL
    assert "deepseek/deepseek-v4-pro" not in candidates


def test_router_falls_back_without_logging_provider_details(
    monkeypatch: object, caplog: object
) -> None:
    """A provider timeout tries the next allowed model and logs no error text."""
    calls: list[str] = []

    class FakeModel:
        def __init__(self, model_id: str) -> None:
            self.model_id = model_id

        async def generate_content_async(
            self, request: LlmRequest, stream: bool = False
        ) -> AsyncGenerator[LlmResponse, None]:
            assert request.model is None
            if self.model_id == model_router.DEFAULT_MODEL:
                raise TimeoutError("sensitive provider response")
            yield LlmResponse(
                content=types.Content(parts=[types.Part(text="fallback response")])
            )

    def factory(context: model_router.ModelContext | None, model_id: str) -> FakeModel:
        calls.append(model_id)
        return FakeModel(model_id)

    monkeypatch.setattr(model_router, "create_lite_llm", factory)
    caplog.set_level(logging.WARNING)
    context = model_router.ModelContext(
        subject="user-test", roles=frozenset({"llm_basic"})
    )
    request = LlmRequest(contents=[types.Content(parts=[types.Part(text="hello")])])

    async def collect() -> list[LlmResponse]:
        token = model_router.set_model_context(context)
        try:
            model = model_router.RoleAwareLiteLlm(model="role-aware-router")
            return [
                response
                async for response in model.generate_content_async(request)
            ]
        finally:
            model_router.reset_model_context(token)

    responses = asyncio.run(collect())

    assert calls == [model_router.DEFAULT_MODEL, "deepseek/deepseek-flash"]
    assert responses[0].content is not None
    assert "fallback response" in str(responses[0].content)
    assert "sensitive provider response" not in caplog.text


def test_router_falls_back_on_invalid_api_key(monkeypatch: object) -> None:
    """A real provider auth failure (bad/expired API key) must also trigger fallback."""
    calls: list[str] = []

    class FakeModel:
        def __init__(self, model_id: str) -> None:
            self.model_id = model_id

        async def generate_content_async(
            self, request: LlmRequest, stream: bool = False
        ) -> AsyncGenerator[LlmResponse, None]:
            if self.model_id == model_router.DEFAULT_MODEL:
                raise AuthenticationError(
                    "invalid api key", llm_provider="deepseek", model=self.model_id
                )
            yield LlmResponse(
                content=types.Content(parts=[types.Part(text="fallback response")])
            )

    def factory(context: model_router.ModelContext | None, model_id: str) -> FakeModel:
        calls.append(model_id)
        return FakeModel(model_id)

    monkeypatch.setattr(model_router, "create_lite_llm", factory)
    context = model_router.ModelContext(
        subject="user-test", roles=frozenset({"llm_basic"})
    )
    request = LlmRequest(contents=[types.Content(parts=[types.Part(text="hello")])])

    async def collect() -> list[LlmResponse]:
        token = model_router.set_model_context(context)
        try:
            model = model_router.RoleAwareLiteLlm(model="role-aware-router")
            return [
                response async for response in model.generate_content_async(request)
            ]
        finally:
            model_router.reset_model_context(token)

    responses = asyncio.run(collect())

    assert calls == [model_router.DEFAULT_MODEL, "deepseek/deepseek-flash"]
    assert "fallback response" in str(responses[0].content)


def test_router_raises_when_all_safe_models_fail(monkeypatch: object) -> None:
    """A user without roles cannot fall back to a model outside the safe tier."""
    calls: list[str] = []

    class FailedModel:
        async def generate_content_async(
            self, request: LlmRequest, stream: bool = False
        ) -> AsyncGenerator[LlmResponse, None]:
            raise TimeoutError("provider unavailable")
            yield

    def factory(context: model_router.ModelContext | None, model_id: str) -> FailedModel:
        calls.append(model_id)
        return FailedModel()

    monkeypatch.setattr(model_router, "create_lite_llm", factory)
    request = LlmRequest()

    async def collect() -> list[LlmResponse]:
        model = model_router.RoleAwareLiteLlm(model="role-aware-router")
        return [response async for response in model.generate_content_async(request)]

    try:
        asyncio.run(collect())
    except model_router.ModelRoutingError as error:
        assert str(error) == "No fue posible responder con los modelos permitidos."
    else:
        raise AssertionError("Expected the safe-model failure to be surfaced")

    assert calls == [model_router.DEFAULT_MODEL]


def test_context_variable_is_scoped_to_async_task() -> None:
    """The router reads the current verified user context for each call."""
    context = model_router.ModelContext(
        subject="admin-test", roles=frozenset({"admin"})
    )
    token = model_router.set_model_context(context)
    try:
        assert model_router.get_model_candidates(model_router._MODEL_CONTEXT.get())[0]
    finally:
        model_router.reset_model_context(token)

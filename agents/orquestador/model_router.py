"""Enruta modelos LiteLLM segun los roles verificados del usuario.

Autor: Daniel
Desde: 2026-10-01
"""

from __future__ import annotations

from collections.abc import Collection
from contextvars import ContextVar, Token
from dataclasses import dataclass
import logging
from typing import AsyncGenerator

import httpx
from google.adk.models.base_llm import BaseLlm
from google.adk.models.lite_llm import LiteLlm
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from openai import APIError

_LOGGER = logging.getLogger(__name__)
DEFAULT_MODEL = "gemini/gemini-3.8-flash"
_BASIC_ROLES = frozenset({"llm_basic"})
_ADVANCED_ROLES = frozenset({"llm_advanced", "admin", "premium"})
MODEL_NAMES: dict[str, str] = {
    "gemini/gemini-3.8-flash": "Gemini 3.8 Flash",
    "deepseek/deepseek-flash": "DeepSeek Flash",
    "deepseek/deepseek-v4-pro": "DeepSeek V4 Pro",
    "gemini/gemini-3.1-pro": "Gemini 3.1 Pro",
}


@dataclass(frozen=True, slots=True)
class ModelDefinition:
    """Describe un modelo y su nivel de acceso."""

    model_id: str
    tier: str


@dataclass(frozen=True, slots=True)
class ModelContext:
    """Identidad verificada y preferencia de modelo de una solicitud."""

    subject: str
    roles: frozenset[str]
    session_id: str | None = None
    preferred_model: str | None = None


class ModelNotAllowedError(ValueError):
    """Indica que un modelo solicitado esta fuera del catalogo autorizado."""


class ModelRoutingError(RuntimeError):
    """Indica que fallaron todos los modelos autorizados para la solicitud."""


_SAFE_MODEL = ModelDefinition(DEFAULT_MODEL, "basic")
_BASIC_MODELS = (
    _SAFE_MODEL,
    ModelDefinition("deepseek/deepseek-flash", "basic"),
)
_ADVANCED_MODELS = (
    ModelDefinition("deepseek/deepseek-v4-pro", "advanced"),
    ModelDefinition("gemini/gemini-3.1-pro", "advanced"),
)
_MODEL_CONTEXT: ContextVar[ModelContext | None] = ContextVar(
    "model_context", default=None
)


def set_model_context(context: ModelContext) -> Token[ModelContext | None]:
    """Asocia el principal verificado con la tarea asincrona actual."""
    return _MODEL_CONTEXT.set(context)


def reset_model_context(token: Token[ModelContext | None]) -> None:
    """Restaura el contexto previo al terminar la solicitud."""
    _MODEL_CONTEXT.reset(token)


def get_allowed_models(roles: Collection[str]) -> tuple[ModelDefinition, ...]:
    """Devuelve el catalogo permitido para los roles normalizados del usuario."""
    normalized_roles = {role.casefold() for role in roles if isinstance(role, str)}
    if normalized_roles.intersection(_ADVANCED_ROLES):
        return (*_BASIC_MODELS, *_ADVANCED_MODELS)
    if normalized_roles.intersection(_BASIC_ROLES):
        return _BASIC_MODELS
    return (_SAFE_MODEL,)


def get_default_model(roles: Collection[str]) -> str:
    """Elige un modelo inicial dentro del catalogo autorizado."""
    normalized_roles = {role.casefold() for role in roles if isinstance(role, str)}
    if normalized_roles.intersection(_ADVANCED_ROLES):
        return _ADVANCED_MODELS[0].model_id
    return DEFAULT_MODEL


def get_model_candidates(context: ModelContext | None) -> tuple[str, ...]:
    """Ordena el modelo preferido y fallbacks sin salir del catalogo permitido."""
    roles = context.roles if context is not None else frozenset()
    allowed = get_allowed_models(roles)
    allowed_ids = tuple(model.model_id for model in allowed)
    preferred = context.preferred_model if context is not None else None
    default = get_default_model(roles)
    ordered = (preferred, default, *allowed_ids)
    return tuple(dict.fromkeys(model for model in ordered if model in allowed_ids))


def create_lite_llm(context: ModelContext | None, model_id: str) -> LiteLlm:
    """Crea un adaptador LiteLlm solo si el modelo pertenece al catalogo del usuario."""
    roles = context.roles if context is not None else frozenset()
    allowed = {model.model_id for model in get_allowed_models(roles)}
    if model_id not in allowed:
        raise ModelNotAllowedError("El modelo solicitado no esta autorizado.")
    _LOGGER.info("Usando modelo LLM (model=%s).", model_id)
    return LiteLlm(model=model_id)


class RoleAwareLiteLlm(BaseLlm):
    """Adapta el contexto de solicitud al modelo LiteLLM y sus fallbacks permitidos."""

    async def generate_content_async(
        self, llm_request: LlmRequest, stream: bool = False
    ) -> AsyncGenerator[LlmResponse, None]:
        """Genera una respuesta y reintenta fallos de proveedor sin elevar permisos."""
        context = _MODEL_CONTEXT.get()
        request = llm_request.model_copy(update={"model": None}, deep=True)
        last_error: Exception | None = None

        for model_id in get_model_candidates(context):
            received_response = False
            try:
                model = create_lite_llm(context, model_id)
                async for response in model.generate_content_async(request, stream):
                    received_response = True
                    yield response
                if received_response:
                    return
                last_error = ModelRoutingError(
                    f"El modelo {model_id} no devolvio una respuesta."
                )
            except (APIError, httpx.HTTPError, TimeoutError) as error:
                if received_response:
                    raise ModelRoutingError(
                        "El proveedor fallo despues de iniciar la respuesta."
                    ) from error
                last_error = error
                _LOGGER.warning(
                    "Fallo del modelo permitido; se prueba una alternativa "
                    "(model=%s, error_type=%s).",
                    model_id,
                    type(error).__name__,
                )

        if last_error is None:
            raise ModelRoutingError("No hay modelos permitidos para esta solicitud.")
        raise ModelRoutingError(
            "No fue posible responder con los modelos permitidos."
        ) from last_error

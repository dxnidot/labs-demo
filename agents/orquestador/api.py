"""Expone el catalogo autorizado de modelos con autenticacion Bearer.

Autor: Daniel
Desde: 2026-10-01
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Protocol

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from google.adk.cli.fast_api import get_fast_api_app
from starlette.middleware.base import RequestResponseEndpoint

load_dotenv(Path(__file__).resolve().with_name(".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)

from .auth import (
    AuthenticationConfigurationError,
    AuthenticatedUser,
    InvalidBearerToken,
    TokenVerificationUnavailable,
    TokenVerifier,
)
from .model_router import (
    MODEL_NAMES,
    ModelContext,
    get_allowed_models,
    reset_model_context,
    set_model_context,
)

_LOGGER = logging.getLogger(__name__)
_MODELS_PATH = "/api/llm/available-models"
_MAX_SESSION_ID_LENGTH = 256


class TokenVerifierPort(Protocol):
    """Define la verificacion asincrona requerida por la API."""

    async def verify(self, token: str) -> AuthenticatedUser:
        """Valida el token y devuelve el principal confiable."""


def _bearer_token(authorization: str | None) -> str:
    if authorization is None:
        raise InvalidBearerToken("Se requiere Authorization Bearer.")
    scheme, separator, token = authorization.partition(" ")
    if (
        scheme.casefold() != "bearer"
        or not separator
        or not token
        or token.strip() != token
        or any(character.isspace() for character in token)
    ):
        raise InvalidBearerToken("Se requiere Authorization Bearer valido.")
    return token


def _allowed_origins() -> list[str] | None:
    raw = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()
    if not raw:
        return None
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def create_app(verifier: TokenVerifierPort | None = None) -> FastAPI:
    """Crea la API protegida y propaga el principal al router de modelos."""
    token_verifier = verifier or TokenVerifier(
        issuer=os.environ.get("KEYCLOAK_ISSUER", "").strip(),
        audience=os.environ.get("KEYCLOAK_AUDIENCE", "").strip(),
    )
    origins = _allowed_origins()
    application = get_fast_api_app(
        agents_dir=str(Path(__file__).resolve().parents[1]),
        web=False,
        allow_origins=origins,
    )

    def _cors_headers(request: Request) -> dict[str, str]:
        """Repite el CORS de ADK en respuestas que cortan la cadena antes de su CORSMiddleware."""
        origin = request.headers.get("Origin")
        if not origin or not origins or origin not in origins:
            return {}
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }

    @application.middleware("http")
    async def authenticate_request(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)
        try:
            token = _bearer_token(request.headers.get("Authorization"))
            principal = await token_verifier.verify(token)
        except InvalidBearerToken:
            return JSONResponse(
                {"detail": "Se requiere un token Bearer valido."},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer", **_cors_headers(request)},
            )
        except (AuthenticationConfigurationError, TokenVerificationUnavailable):
            return JSONResponse(
                {"detail": "El servicio de autenticacion no esta disponible."},
                status_code=503,
                headers=_cors_headers(request),
            )

        requested_model = request.headers.get("X-LLM-Model")
        if requested_model is not None:
            requested_model = requested_model.strip()
            allowed_ids = {
                model.model_id for model in get_allowed_models(principal.roles)
            }
            if requested_model not in allowed_ids:
                _LOGGER.warning(
                    "Modelo pedido por el cliente fuera de catalogo (model=%s).",
                    requested_model,
                )
                return JSONResponse(
                    {"detail": "El modelo solicitado no esta autorizado."},
                    status_code=403,
                    headers=_cors_headers(request),
                )
            _LOGGER.info("Header X-LLM-Model autorizado (model=%s).", requested_model)

        session_id = request.headers.get("X-ADK-Session-ID")
        if session_id is not None:
            session_id = session_id.strip()
            if not session_id or len(session_id) > _MAX_SESSION_ID_LENGTH:
                return JSONResponse(
                    {"detail": "X-ADK-Session-ID no es valido."},
                    status_code=400,
                    headers=_cors_headers(request),
                )

        request.state.principal = principal
        context_token = set_model_context(
            ModelContext(
                subject=principal.subject,
                roles=principal.roles,
                session_id=session_id,
                preferred_model=requested_model,
            )
        )
        try:
            return await call_next(request)
        finally:
            reset_model_context(context_token)

    @application.get(_MODELS_PATH)
    async def listar_modelos_disponibles(request: Request) -> list[dict[str, str]]:
        """Devuelve el catalogo de modelos autorizado para el principal de la solicitud."""
        principal: AuthenticatedUser = request.state.principal
        return [
            {
                "id": model.model_id,
                "name": MODEL_NAMES.get(model.model_id, model.model_id),
                "tier": model.tier,
            }
            for model in get_allowed_models(principal.roles)
        ]

    return application

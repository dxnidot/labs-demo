"""Pruebas del endpoint de catalogo de modelos y la autenticacion Bearer.

Autor: Daniel
Desde: 2026-10-01
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from orquestador.api import create_app
from orquestador.auth import AuthenticatedUser, InvalidBearerToken


class _FakeVerifier:
    """Resuelve un principal fijo por token, sin validar JWT de verdad."""

    def __init__(self, users: dict[str, AuthenticatedUser]) -> None:
        self._users = users

    async def verify(self, token: str) -> AuthenticatedUser:
        user = self._users.get(token)
        if user is None:
            raise InvalidBearerToken("Token de prueba desconocido.")
        return user


def _client(users: dict[str, AuthenticatedUser]) -> TestClient:
    app = create_app(verifier=_FakeVerifier(users))
    return TestClient(app)


def test_available_models_rejects_missing_token() -> None:
    client = _client({})

    response = client.get("/api/llm/available-models")

    assert response.status_code == 401


def test_error_responses_still_carry_cors_headers(monkeypatch: object) -> None:
    """A 401 from the auth middleware must not be invisible to the browser as a CORS failure."""
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
    client = _client({})

    response = client.get(
        "/api/llm/available-models",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 401
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_preflight_bypasses_auth(monkeypatch: object) -> None:
    """The browser's OPTIONS preflight carries no Authorization and must not get 401."""
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
    client = _client({})

    response = client.options(
        "/api/llm/available-models",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_available_models_returns_only_safe_default_without_roles() -> None:
    client = _client(
        {"sin-roles": AuthenticatedUser(subject="user-1", roles=frozenset())}
    )

    response = client.get(
        "/api/llm/available-models",
        headers={"Authorization": "Bearer sin-roles"},
    )

    assert response.status_code == 200
    body = response.json()
    assert [model["id"] for model in body] == ["gemini/gemini-3.8-flash"]


def test_available_models_includes_both_tiers_for_advanced_role() -> None:
    client = _client(
        {
            "avanzado": AuthenticatedUser(
                subject="user-2", roles=frozenset({"llm_advanced"})
            )
        }
    )

    response = client.get(
        "/api/llm/available-models",
        headers={"Authorization": "Bearer avanzado"},
    )

    assert response.status_code == 200
    body = response.json()
    ids = {model["id"] for model in body}
    assert ids == {
        "gemini/gemini-3.8-flash",
        "deepseek/deepseek-flash",
        "deepseek/deepseek-v4-pro",
        "gemini/gemini-3.1-pro",
    }
    assert all(model["name"] for model in body)

"""Valida tokens OIDC de Keycloak y extrae los roles del usuario.

Autor: Daniel
Desde: 2026-10-01
"""

from __future__ import annotations

import asyncio
from collections.abc import Mapping
from dataclasses import dataclass
import time

import httpx
from authlib.jose import JsonWebKey, JsonWebToken
from authlib.jose.errors import JoseError
from authlib.jose.rfc7517.key_set import KeySet


class InvalidBearerToken(ValueError):
    """Indica que el token no es valido o no pertenece a esta API."""


class AuthenticationConfigurationError(RuntimeError):
    """Indica que falta configurar el issuer o audience de Keycloak."""


class TokenVerificationUnavailable(RuntimeError):
    """Indica que no se pudo obtener un conjunto de claves JWKS valido."""


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    """Representa el subject y los roles extraidos de un JWT verificado."""

    subject: str
    roles: frozenset[str]


def _roles_from_claim(value: object) -> set[str]:
    if not isinstance(value, list):
        return set()
    return {role for role in value if isinstance(role, str) and role.strip()}


def extract_roles(claims: Mapping[str, object]) -> frozenset[str]:
    """Combina roles de realm_access y de todos los resource_access."""
    roles: set[str] = set()
    realm_access = claims.get("realm_access")
    if isinstance(realm_access, Mapping):
        roles.update(_roles_from_claim(realm_access.get("roles")))

    resource_access = claims.get("resource_access")
    if isinstance(resource_access, Mapping):
        for client_access in resource_access.values():
            if isinstance(client_access, Mapping):
                roles.update(_roles_from_claim(client_access.get("roles")))
    return frozenset(roles)


class TokenVerifier:
    """Verifica firma RS256, issuer, audience, expiracion y claves JWKS."""

    _JWKS_CACHE_SECONDS = 300
    _REQUEST_TIMEOUT_SECONDS = 5.0
    _TOKEN_MAX_LENGTH = 8192

    def __init__(self, issuer: str, audience: str) -> None:
        self._issuer = issuer.rstrip("/")
        self._audience = audience
        self._jwks_uri = (
            f"{self._issuer}/protocol/openid-connect/certs"
            if self._issuer
            else ""
        )
        self._jwt = JsonWebToken(["RS256"])
        self._key_set: KeySet | None = None
        self._keys_loaded_at = 0.0
        self._refresh_lock = asyncio.Lock()

    async def verify(self, token: str) -> AuthenticatedUser:
        """Verifica un access token y devuelve sus roles confiables."""
        if not self._issuer or not self._audience:
            raise AuthenticationConfigurationError(
                "Configure KEYCLOAK_ISSUER y KEYCLOAK_AUDIENCE."
            )
        if not token or len(token) > self._TOKEN_MAX_LENGTH:
            raise InvalidBearerToken("El token no es valido.")

        key_set = await self._get_key_set()
        try:
            claims = self._jwt.decode(
                token,
                key_set,
                claims_options={
                    "iss": {"essential": True, "value": self._issuer},
                    "aud": {
                        "essential": True,
                        "values": [self._audience],
                    },
                    "exp": {"essential": True},
                    "sub": {"essential": True},
                },
            )
            claims.validate(leeway=30)
        except (JoseError, KeyError, TypeError, ValueError) as error:
            raise InvalidBearerToken("El token no es valido.") from error

        subject = claims.get("sub")
        if not isinstance(subject, str) or not subject:
            raise InvalidBearerToken("El token no es valido.")
        return AuthenticatedUser(subject=subject, roles=extract_roles(claims))

    async def _get_key_set(self) -> KeySet:
        if (
            self._key_set is not None
            and time.monotonic() - self._keys_loaded_at < self._JWKS_CACHE_SECONDS
        ):
            return self._key_set

        async with self._refresh_lock:
            if (
                self._key_set is not None
                and time.monotonic() - self._keys_loaded_at < self._JWKS_CACHE_SECONDS
            ):
                return self._key_set
            key_set = await self._fetch_key_set()
            self._key_set = key_set
            self._keys_loaded_at = time.monotonic()
            return key_set

    async def _fetch_key_set(self) -> KeySet:
        try:
            async with httpx.AsyncClient(
                timeout=self._REQUEST_TIMEOUT_SECONDS
            ) as client:
                response = await client.get(self._jwks_uri)
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise TokenVerificationUnavailable(
                "No se pudieron consultar las claves de autenticacion."
            ) from error

        raw_keys = payload.get("keys") if isinstance(payload, Mapping) else None
        if not isinstance(raw_keys, list):
            raise TokenVerificationUnavailable("La respuesta JWKS no es valida.")
        signing_keys = [
            key
            for key in raw_keys
            if isinstance(key, Mapping)
            and key.get("use", "sig") == "sig"
            and key.get("kty") == "RSA"
        ]
        if not signing_keys:
            raise TokenVerificationUnavailable(
                "La respuesta JWKS no tiene claves RSA de firma."
            )
        return JsonWebKey.import_key_set({"keys": signing_keys})

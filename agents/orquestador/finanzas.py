"""Herramientas financieras ADK con identidad de sesión y escritura confirmada.

Autor: Daniel Tovar
Desde: 2026-09-30
"""

from __future__ import annotations

from datetime import date
import math
import os
import re
import threading
import unicodedata
from collections.abc import Callable
from typing import Any

import requests
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools import ToolContext

_PENDING_STATE_KEY = "finanzas:pending_write"
_TOOL_CALL_INVOCATION_KEY = "finanzas:tool_call_invocation"
_TOOL_CALL_COUNT_KEY = "finanzas:tool_call_count"
_WRITE_LOCK = threading.RLock()
_TIMEOUT_SECONDS = 15
_CONFIRMATION_PHRASES = {
    "confirmo",
    "sí confirmo",
    "si confirmo",
    "confirmo el registro",
    "sí confirmo el registro",
    "si confirmo el registro",
}
_ALLOWED_CURRENCIES = {"MXN", "USD"}
_ALLOWED_ORIGINS = {"MANUAL", "IMPORT", "NOTIFICACION"}
_ALLOWED_MOVEMENT_TYPES = {"GASTO", "INGRESO"}


class FinanzasApiClient:
    """Cliente HTTP pequeño para el API de finanzas y OAuth client_credentials."""

    def __init__(self, http_client: Any = requests) -> None:
        """Inicializa el cliente con un transporte sustituible en pruebas."""
        self._http = http_client

    @staticmethod
    def _environment_value(name: str) -> str | None:
        """Obtiene una variable de configuración sin cargar archivos de entorno."""
        value = os.environ.get(name, "").strip()
        return value or None

    def _access_token(self) -> str | None:
        """Solicita un token de servicio sin exponerlo en errores ni resultados."""
        client_id = self._environment_value("FINANZAS_AGENT_CLIENT_ID")
        client_secret = self._environment_value("FINANZAS_AGENT_CLIENT_SECRET")
        token_url = self._environment_value("FINANZAS_AGENT_TOKEN_URL")
        if not client_id or not client_secret or not token_url:
            return None

        try:
            response = self._http.post(
                token_url,
                data={"grant_type": "client_credentials"},
                auth=(client_id, client_secret),
                timeout=_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            token = response.json().get("access_token")
        except Exception:
            return None

        return token if isinstance(token, str) and token.strip() else None

    def _request(
        self,
        method: str,
        path: str,
        *,
        user_sub: str,
        params: dict[str, str | int] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Ejecuta una llamada autenticada y devuelve errores sin cuerpos remotos."""
        base_url = self._environment_value("FINANZAS_API_URL")
        if not base_url:
            return {
                "status": "error",
                "mensaje": "Falta configurar el servicio de finanzas.",
            }

        token = self._access_token()
        if token is None:
            return {
                "status": "error",
                "mensaje": "No fue posible autenticar el servicio de finanzas.",
            }

        try:
            request_method = getattr(self._http, method.lower())
            response = request_method(
                f"{base_url.rstrip('/')}{path}",
                params=params,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-User-Sub": user_sub,
                },
                timeout=_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except Exception:
            status_code = getattr(locals().get("response"), "status_code", None)
            if isinstance(status_code, int):
                return {
                    "status": "error",
                    "mensaje": (
                        "El servicio de finanzas rechazó la solicitud "
                        f"(HTTP {status_code})."
                    ),
                }
            return {
                "status": "error",
                "mensaje": "No fue posible comunicarse con el servicio de finanzas.",
            }

        if getattr(response, "status_code", None) == 204:
            return {"status": "success", "mensaje": "Operación completada."}
        try:
            data = response.json()
        except (AttributeError, TypeError, ValueError):
            return {
                "status": "error",
                "mensaje": "El servicio de finanzas devolvió una respuesta no válida.",
            }
        return {"status": "success", "data": _remove_owner_sub(data)}

    def post(
        self, path: str, payload: dict[str, Any], user_sub: str
    ) -> dict[str, Any]:
        """Envía una escritura autenticada al API financiero."""
        return self._request("post", path, user_sub=user_sub, payload=payload)

    def get(
        self, path: str, params: dict[str, str | int], user_sub: str
    ) -> dict[str, Any]:
        """Consulta el API financiero con parámetros codificados por el transporte."""
        return self._request("get", path, user_sub=user_sub, params=params)


def _remove_owner_sub(value: Any) -> Any:
    """Elimina ownerSub recursivamente antes de devolver datos al modelo."""
    if isinstance(value, dict):
        return {
            key: _remove_owner_sub(item)
            for key, item in value.items()
            if str(key).replace("_", "").replace("-", "").casefold()
            != "ownersub"
        }
    if isinstance(value, list):
        return [_remove_owner_sub(item) for item in value]
    return value


def _required_text(value: str, label: str) -> str:
    """Valida texto obligatorio sin generar ni completar datos faltantes."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} es obligatorio y no puede estar vacío.")
    return value.strip()


def _validate_day(value: int, label: str) -> int:
    """Valida un día de corte o pago sin calcular una fecha inexistente."""
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 31:
        raise ValueError(f"{label} debe ser un entero entre 1 y 31.")
    return value


def _validate_iso_date(value: str, label: str) -> str:
    """Valida una fecha calendario completa con formato ISO estricto."""
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError(f"{label} debe tener formato YYYY-MM-DD.")
    try:
        date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{label} no es una fecha válida.") from error
    return value


def _tool_identity(tool_context: ToolContext) -> tuple[str, str, str] | None:
    """Obtiene usuario, sesión e invocación únicamente del contexto ADK."""
    session = tool_context.session
    session_id = getattr(session, "id", None)
    user_id = getattr(session, "user_id", None)
    invocation_id = getattr(tool_context, "invocation_id", None)
    if not all(isinstance(value, str) and value.strip() for value in (
        session_id,
        user_id,
        invocation_id,
    )):
        return None
    return session_id, user_id, invocation_id


def _is_explicit_confirmation(tool_context: ToolContext) -> bool:
    """Reconoce únicamente frases literales en el mensaje del turno actual."""
    content = getattr(tool_context, "user_content", None)
    parts = getattr(content, "parts", None)
    if not isinstance(parts, list) or len(parts) != 1:
        return False
    text = getattr(parts[0], "text", None)
    if not isinstance(text, str):
        return False
    normalized = unicodedata.normalize("NFKC", text).casefold().strip()
    normalized = normalized.rstrip(".!¡?¿ \t\r\n")
    return normalized in _CONFIRMATION_PHRASES


def _is_immediately_following_turn(
    tool_context: ToolContext, previous_invocation_id: str
) -> bool:
    """Comprueba en el historial ADK que no hubo otro turno de usuario intermedio."""
    events = getattr(tool_context.session, "events", None)
    if not isinstance(events, list):
        return False
    current_invocation_id = tool_context.invocation_id
    current_user_index = next(
        (
            index
            for index in range(len(events) - 1, -1, -1)
            if getattr(events[index], "author", None) == "user"
            and getattr(events[index], "invocation_id", None)
            == current_invocation_id
        ),
        None,
    )
    if current_user_index is None:
        return False
    previous_user_event = next(
        (
            events[index]
            for index in range(current_user_index - 1, -1, -1)
            if getattr(events[index], "author", None) == "user"
        ),
        None,
    )
    return (
        previous_user_event is not None
        and getattr(previous_user_event, "invocation_id", None)
        == previous_invocation_id
    )


def _contar_llamada_herramienta(
    tool: Any, args: dict[str, Any], tool_context: ToolContext
) -> dict[str, Any] | None:
    """Cuenta llamadas de herramientas ADK en la invocación, sin intervención del LLM."""
    del tool, args
    invocation_id = tool_context.invocation_id
    with _WRITE_LOCK:
        if tool_context.state.get(_TOOL_CALL_INVOCATION_KEY) == invocation_id:
            count = tool_context.state.get(_TOOL_CALL_COUNT_KEY, 0) + 1
        else:
            count = 1
        tool_context.state[_TOOL_CALL_INVOCATION_KEY] = invocation_id
        tool_context.state[_TOOL_CALL_COUNT_KEY] = count
    return None


def _write_or_preview(
    operation: str,
    path: str,
    payload_factory: Callable[[], dict[str, Any]],
    tool_context: ToolContext,
) -> dict[str, Any]:
    """Guarda un preview y solo escribe con confirmación literal de otro turno."""
    identity = _tool_identity(tool_context)
    if identity is None:
        return {
            "status": "error",
            "mensaje": "No se pudo acreditar la identidad de la sesión ADK.",
        }
    session_id, user_id, invocation_id = identity

    with _WRITE_LOCK:
        if (
            tool_context.state.get(_TOOL_CALL_INVOCATION_KEY) != invocation_id
            or tool_context.state.get(_TOOL_CALL_COUNT_KEY) != 1
        ):
            return {
                "status": "pending",
                "mensaje": (
                    "Esta no fue la primera llamada a herramienta de la "
                    "invocación. No se realizó ninguna escritura; continúa en "
                    "un turno posterior."
                ),
            }
        pending = tool_context.state.get(_PENDING_STATE_KEY)
        if pending is None:
            try:
                payload = payload_factory()
            except (OverflowError, TypeError, ValueError) as error:
                return {"status": "error", "mensaje": str(error)}
            tool_context.state[_PENDING_STATE_KEY] = {
                "operation": operation,
                "payload": payload,
                "session_id": session_id,
                "user_id": user_id,
                "created_invocation_id": invocation_id,
            }
            return {
                "status": "preview",
                "mensaje": (
                    "Vista previa únicamente; todavía no se envió nada. "
                    "Solo se guardará si confirmas expresamente en un turno "
                    "siguiente de esta misma sesión. Responde «Confirmo»."
                ),
                "vista_previa": payload,
            }

        if not isinstance(pending, dict) or any(
            pending.get(key) != expected
            for key, expected in (
                ("session_id", session_id),
                ("user_id", user_id),
            )
        ):
            tool_context.state[_PENDING_STATE_KEY] = None
            return {
                "status": "error",
                "mensaje": (
                    "La vista previa no corresponde a esta sesión y usuario; "
                    "no se realizó ninguna escritura."
                ),
            }
        if pending.get("operation") != operation:
            return {
                "status": "pending",
                "mensaje": (
                    "Hay otra vista previa pendiente y esta llamada no puede "
                    "cambiarla. No se realizó ninguna escritura; confírmala en "
                    "el turno permitido o vuelve a enviar los datos después."
                ),
            }
        if pending.get("created_invocation_id") == invocation_id:
            return {
                "status": "pending",
                "mensaje": (
                    "La vista previa de este turno no se puede confirmar en "
                    "la misma invocación. Confirma en un turno posterior."
                ),
                "vista_previa": pending.get("payload"),
            }
        if not _is_immediately_following_turn(
            tool_context, pending.get("created_invocation_id", "")
        ):
            tool_context.state[_PENDING_STATE_KEY] = None
            return {
                "status": "expired",
                "mensaje": (
                    "La vista previa ya no pertenece al turno inmediatamente "
                    "anterior; no se realizó ninguna escritura. Vuelve a enviar "
                    "los datos para preparar una nueva."
                ),
            }
        if not _is_explicit_confirmation(tool_context):
            return {
                "status": "pending",
                "mensaje": (
                    "No se detectó una confirmación literal e inequívoca en "
                    "este mensaje; no se realizó ninguna escritura. Si deseas "
                    "continuar, responde «Confirmo»."
                ),
            }

        saved_payload = pending.get("payload")
        if not isinstance(saved_payload, dict):
            tool_context.state[_PENDING_STATE_KEY] = None
            return {
                "status": "error",
                "mensaje": "La vista previa no es válida; no se realizó la escritura.",
            }

        # Consumir antes de la red evita replays incluso si el resultado HTTP es incierto.
        tool_context.state[_PENDING_STATE_KEY] = None
        try:
            result = FinanzasApiClient().post(path, saved_payload, user_id)
        except Exception:
            return {
                "status": "error",
                "mensaje": (
                    "No se pudo completar la escritura; la confirmación se "
                    "consumió para evitar duplicados. Verifica el registro "
                    "antes de volver a intentarlo."
                ),
            }
        return result


def registrar_tarjetas(
    tool_context: ToolContext,
    alias: str | None = None,
    ultimos4: str | None = None,
    diaCorte: int | None = None,
    diaPago: int | None = None,
    permiteLiquidarMsiAnticipado: bool | None = None,
    activa: bool | None = None,
) -> dict[str, Any]:
    """Prepara una tarjeta y la registra solo tras confirmación en otro turno.

    Captura exclusivamente alias y últimos cuatro dígitos; no proporciones
    ni solicites el número completo. La primera llamada muestra una vista
    previa y no hace HTTP de escritura. Después solo guarda esa vista previa
    si el usuario responde literalmente «Confirmo» en un turno posterior.
    No pidas al modelo que decida una confirmación ni aceptes otros datos para
    modificar una vista previa pendiente.
    """

    def crear_payload() -> dict[str, Any]:
        """Valida los campos requeridos al crear una vista previa nueva."""
        if (
            alias is None
            or ultimos4 is None
            or diaCorte is None
            or diaPago is None
            or permiteLiquidarMsiAnticipado is None
            or activa is None
        ):
            raise ValueError(
                "Para preparar una tarjeta indica alias, ultimos4, diaCorte, "
                "diaPago, permiteLiquidarMsiAnticipado y activa."
            )
        safe_alias = _required_text(alias, "alias")
        if not isinstance(ultimos4, str) or not re.fullmatch(r"\d{4}", ultimos4):
            raise ValueError("ultimos4 debe contener exactamente cuatro dígitos.")
        corte = _validate_day(diaCorte, "diaCorte")
        pago = _validate_day(diaPago, "diaPago")
        if not isinstance(permiteLiquidarMsiAnticipado, bool):
            raise ValueError("permiteLiquidarMsiAnticipado debe ser booleano.")
        if not isinstance(activa, bool):
            raise ValueError("activa debe ser booleano.")
        return {
            "alias": safe_alias,
            "ultimos4": ultimos4,
            "diaCorte": corte,
            "diaPago": pago,
            "permiteLiquidarMsiAnticipado": permiteLiquidarMsiAnticipado,
            "activa": activa,
        }

    return _write_or_preview(
        "tarjetas", "/api/finanzas/tarjetas", crear_payload, tool_context
    )


def registrar_movimientos(
    tool_context: ToolContext,
    fecha: str | None = None,
    monto: float | None = None,
    moneda: str | None = None,
    comercio: str | None = None,
    categoria: str | None = None,
    tarjetaId: str | None = None,
    origen: str | None = None,
    tipo: str | None = None,
) -> dict[str, Any]:
    """Prepara un movimiento y lo registra solo tras confirmación en otro turno.

    Requiere la fecha, el monto positivo, la moneda, el comercio, la categoría,
    el origen y el tipo expresamente proporcionados. La primera llamada solo
    prepara una vista previa; el POST usa esa vista sin volver a tomar datos
    del modelo y exige «Confirmo» en un turno posterior de la misma sesión.
    """

    def crear_payload() -> dict[str, Any]:
        """Valida todos los campos explícitos antes de crear una vista previa."""
        if (
            fecha is None
            or monto is None
            or moneda is None
            or comercio is None
            or categoria is None
            or origen is None
            or tipo is None
        ):
            raise ValueError(
                "Para preparar un movimiento indica fecha, monto, moneda, "
                "comercio, categoria, origen y tipo."
            )
        safe_fecha = _validate_iso_date(fecha, "fecha")
        if isinstance(monto, bool) or not isinstance(monto, (int, float)):
            raise ValueError("monto debe ser un número finito mayor que cero.")
        numeric_amount = float(monto)
        if not math.isfinite(numeric_amount) or numeric_amount <= 0:
            raise ValueError("monto debe ser un número finito mayor que cero.")
        if moneda not in _ALLOWED_CURRENCIES:
            raise ValueError("moneda debe ser MXN o USD.")
        safe_comercio = _required_text(comercio, "comercio")
        safe_categoria = _required_text(categoria, "categoria")
        if tarjetaId is not None and (
            not isinstance(tarjetaId, str) or not tarjetaId.strip()
        ):
            raise ValueError("tarjetaId debe ser un identificador o null.")
        if origen not in _ALLOWED_ORIGINS:
            raise ValueError("origen debe ser MANUAL, IMPORT o NOTIFICACION.")
        if tipo not in _ALLOWED_MOVEMENT_TYPES:
            raise ValueError("tipo debe ser GASTO o INGRESO.")
        return {
            "fecha": safe_fecha,
            "monto": numeric_amount,
            "moneda": moneda,
            "comercio": safe_comercio,
            "categoria": safe_categoria,
            "tarjetaId": tarjetaId.strip() if tarjetaId is not None else None,
            "origen": origen,
            "tipo": tipo,
        }

    return _write_or_preview(
        "movimientos",
        "/api/finanzas/movimientos",
        crear_payload,
        tool_context,
    )


def consultar_resumen(periodo: str, tool_context: ToolContext) -> dict[str, Any]:
    """Consulta el resumen mensual del API sin combinar tipos ni monedas.

    Args:
        periodo: Mes solicitado con formato YYYY-MM.
        tool_context: Contexto ADK usado para acreditar la sesión.

    Returns:
        Respuesta calculada por el API, sin campos ownerSub.
    """
    if not isinstance(periodo, str) or not re.fullmatch(r"\d{4}-\d{2}", periodo):
        return {"status": "error", "mensaje": "periodo debe tener formato YYYY-MM."}
    try:
        date.fromisoformat(f"{periodo}-01")
    except ValueError:
        return {"status": "error", "mensaje": "periodo no es un mes válido."}
    identity = _tool_identity(tool_context)
    if identity is None:
        return {
            "status": "error",
            "mensaje": "No se pudo acreditar la identidad de la sesión ADK.",
        }
    return FinanzasApiClient().get(
        "/api/finanzas/movimientos/resumen-mensual",
        {"periodo": periodo},
        identity[1],
    )


def consultar_calendario(
    desde: str, dias: int, tool_context: ToolContext
) -> dict[str, Any]:
    """Consulta el calendario de tarjetas calculado por el servicio financiero.

    Args:
        desde: Fecha inicial en formato YYYY-MM-DD.
        dias: Cantidad positiva de días a consultar.
        tool_context: Contexto ADK usado para acreditar la sesión.

    Returns:
        Fechas del calendario devueltas por el API, sin campos ownerSub.
    """
    try:
        safe_desde = _validate_iso_date(desde, "desde")
        if isinstance(dias, bool) or not isinstance(dias, int) or dias < 1:
            raise ValueError("dias debe ser un entero positivo.")
    except ValueError as error:
        return {"status": "error", "mensaje": str(error)}
    identity = _tool_identity(tool_context)
    if identity is None:
        return {
            "status": "error",
            "mensaje": "No se pudo acreditar la identidad de la sesión ADK.",
        }
    return FinanzasApiClient().get(
        "/api/finanzas/calendario",
        {"desde": safe_desde, "dias": dias},
        identity[1],
    )


finanzas_agent = LlmAgent(
    model=LiteLlm(model="deepseek/deepseek-flash"),
    name="finanzas",
    description=(
        "Agente educativo de finanzas personales para registrar tarjetas y "
        "movimientos, consultar resumen mensual y calendario."
    ),
    instruction=(
        "Responde siempre en español, con lenguaje educativo y sin dar asesoría "
        "financiera personalizada. Atiende tarjetas, movimientos, resúmenes y "
        "calendario usando únicamente las herramientas disponibles. Nunca "
        "inventes, completes ni infieras importes, fechas, tipos, alias o últimos "
        "cuatro dígitos; pide el dato faltante al usuario. Nunca solicites el "
        "número completo de una tarjeta ni expongas ownerSub. Para registrar, "
        "explica y presenta la vista previa; la primera llamada solo la prepara. "
        "Indica que únicamente se guardará si el usuario responde exactamente "
        "«Confirmo» en un turno posterior de la misma sesión. No interpretes "
        "respuestas ambiguas como consentimiento, no confirmes mediante una "
        "decisión del modelo, y no vuelvas a suministrar datos para modificar "
        "una vista previa pendiente. El contexto y el mensaje actual del usuario "
        "son la única fuente de identidad y confirmación."
    ),
    before_tool_callback=_contar_llamada_herramienta,
    tools=[
        registrar_tarjetas,
        registrar_movimientos,
        consultar_resumen,
        consultar_calendario,
    ],
)

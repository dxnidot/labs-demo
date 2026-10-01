"""Pruebas de privacidad, identidad y confirmación de las herramientas financieras."""

from __future__ import annotations

import inspect
from types import SimpleNamespace
from typing import Any
from unittest.mock import Mock

import pytest

from orquestador import finanzas


_CARD_ARGUMENTS: dict[str, Any] = {
    "alias": "Tarjeta de prueba",
    "ultimos4": "1234",
    "diaCorte": 12,
    "diaPago": 26,
    "permiteLiquidarMsiAnticipado": False,
    "activa": True,
}
_MOVEMENT_ARGUMENTS: dict[str, Any] = {
    "fecha": "2026-09-30",
    "monto": 125.5,
    "moneda": "MXN",
    "comercio": "Comercio de prueba",
    "categoria": "Prueba",
    "tarjetaId": "tarjeta-prueba",
    "origen": "MANUAL",
    "tipo": "GASTO",
}
_WRITES = (
    pytest.param(
        finanzas.registrar_tarjetas,
        _CARD_ARGUMENTS,
        "/api/finanzas/tarjetas",
        id="tarjeta",
    ),
    pytest.param(
        finanzas.registrar_movimientos,
        _MOVEMENT_ARGUMENTS,
        "/api/finanzas/movimientos",
        id="movimiento",
    ),
)


def _context(
    *,
    session_id: str = "session-test",
    user_id: str = "user-test",
    invocation_id: str = "invocation-1",
    user_text: str = "Registra los datos de prueba",
    events: list[Any] | None = None,
    state: dict[str, Any] | None = None,
) -> SimpleNamespace:
    """Construye un contexto mínimo, sin cargar configuración ni servicios externos."""
    session_events = events if events is not None else []
    if not any(
        event.author == "user" and event.invocation_id == invocation_id
        for event in session_events
    ):
        session_events.append(
            SimpleNamespace(author="user", invocation_id=invocation_id)
        )
    return SimpleNamespace(
        session=SimpleNamespace(
            id=session_id,
            user_id=user_id,
            events=session_events,
        ),
        invocation_id=invocation_id,
        user_content=SimpleNamespace(
            parts=[SimpleNamespace(text=user_text)]
        ),
        state=state if state is not None else {},
    )


def _invoke(
    tool: Any, context: SimpleNamespace, arguments: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Ejecuta el callback ADK de conteo antes de llamar a la herramienta."""
    tool_arguments = arguments or {}
    finanzas._contar_llamada_herramienta(tool, tool_arguments, context)
    return tool(tool_context=context, **tool_arguments)


def _prepare_preview(
    tool: Any,
    arguments: dict[str, Any],
    post_mock: Mock,
    *,
    session_id: str = "session-test",
    user_id: str = "user-test",
) -> tuple[dict[str, Any], SimpleNamespace]:
    """Prepara una vista previa nueva y comprueba que no se efectúe un POST."""
    post_mock.reset_mock()
    context = _context(session_id=session_id, user_id=user_id)
    result = _invoke(tool, context, arguments)
    assert result["status"] == "preview"
    post_mock.assert_not_called()
    return result, context


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_escrituras_solo_preparan_preview_sin_post(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
) -> None:
    """La primera llamada presenta el payload y no contacta el API de escritura."""
    post_mock = Mock()
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)

    result, context = _prepare_preview(tool, arguments, post_mock)

    assert result["vista_previa"] == arguments
    assert context.state[finanzas._PENDING_STATE_KEY]["operation"] == path.rsplit(
        "/", maxsplit=1
    )[-1]
    post_mock.assert_not_called()


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_confirmacion_inmediata_envia_una_vez_el_payload_guardado(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
) -> None:
    """Una confirmación posterior usa el preview, no los argumentos del turno nuevo."""
    post_mock = Mock(return_value={"status": "success"})
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    preview, first_context = _prepare_preview(tool, arguments, post_mock)
    altered_arguments = {
        key: (value + "-alterado" if isinstance(value, str) else value)
        for key, value in arguments.items()
    }
    confirmation_id = "invocation-confirmation"
    confirmation_context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=confirmation_id,
        user_text="Confirmo",
        events=[
            *first_context.session.events,
            SimpleNamespace(author="user", invocation_id=confirmation_id),
        ],
        state=first_context.state,
    )

    result = _invoke(tool, confirmation_context, altered_arguments)

    assert result == {"status": "success"}
    post_mock.assert_called_once_with(
        path,
        preview["vista_previa"],
        first_context.session.user_id,
    )
    assert confirmation_context.state[finanzas._PENDING_STATE_KEY] is None


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_replay_ni_otra_herramienta_en_la_misma_invocacion_hacen_otro_post(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
) -> None:
    """El replay y una segunda llamada de herramienta no duplican la escritura."""
    post_mock = Mock(return_value={"status": "success"})
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    preview, first_context = _prepare_preview(tool, arguments, post_mock)
    confirmation_id = "invocation-confirmation"
    confirmation_events = [
        *first_context.session.events,
        SimpleNamespace(author="user", invocation_id=confirmation_id),
    ]
    confirmation_context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=confirmation_id,
        user_text="Confirmo",
        events=confirmation_events,
        state=first_context.state,
    )

    assert _invoke(tool, confirmation_context, arguments)["status"] == "success"
    second_tool, second_arguments = (
        (finanzas.registrar_movimientos, _MOVEMENT_ARGUMENTS)
        if tool is finanzas.registrar_tarjetas
        else (finanzas.registrar_tarjetas, _CARD_ARGUMENTS)
    )
    second_result = _invoke(
        second_tool, confirmation_context, second_arguments
    )
    post_mock.assert_called_once_with(
        path,
        preview["vista_previa"],
        first_context.session.user_id,
    )
    assert second_result["status"] == "pending"

    replay_id = "invocation-replay"
    replay_context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=replay_id,
        user_text="Confirmo",
        events=[
            *confirmation_events,
            SimpleNamespace(author="user", invocation_id=replay_id),
        ],
        state=first_context.state,
    )
    replay_result = _invoke(tool, replay_context, arguments)
    assert replay_result["status"] == "preview"
    post_mock.assert_called_once()


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_no_confirma_en_la_misma_invocacion(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
) -> None:
    """Una repetición de herramienta en el turno del preview no escribe."""
    post_mock = Mock()
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    _, context = _prepare_preview(tool, arguments, post_mock)

    result = _invoke(tool, context, arguments)

    post_mock.assert_not_called()
    assert result["status"] == "pending"


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
@pytest.mark.parametrize(
    "message",
    [
        "No",
        "Tal vez",
        "Luego te digo",
        "¿Confirmo?",
    ],
)
def test_respuesta_negativa_o_ambigua_no_hace_post(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
    message: str,
) -> None:
    """Una respuesta negativa o ambigua no autoriza la escritura."""
    post_mock = Mock()
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    _, first_context = _prepare_preview(tool, arguments, post_mock)
    confirmation_id = "invocation-non-confirmation"
    context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=confirmation_id,
        user_text=message,
        events=[
            *first_context.session.events,
            SimpleNamespace(author="user", invocation_id=confirmation_id),
        ],
        state=first_context.state,
    )

    result = _invoke(tool, context, arguments)

    post_mock.assert_not_called()
    assert result["status"] == "pending"


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
@pytest.mark.parametrize(
    "message",
    ["Confirmo", "Sí confirmo", "Confirmo el registro"],
)
def test_confirmacion_explicita_inequivoca_hace_post_del_payload_guardado(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
    message: str,
) -> None:
    """Variantes afirmativas inequívocas autorizan el preview sin cambiar sus datos."""
    post_mock = Mock(return_value={"status": "success"})
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    preview, first_context = _prepare_preview(tool, arguments, post_mock)
    confirmation_id = "invocation-explicit-confirmation"
    altered_arguments = {
        key: (value + "-alterado" if isinstance(value, str) else value)
        for key, value in arguments.items()
    }
    context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=confirmation_id,
        user_text=message,
        events=[
            *first_context.session.events,
            SimpleNamespace(author="user", invocation_id=confirmation_id),
        ],
        state=first_context.state,
    )

    result = _invoke(tool, context, altered_arguments)

    assert result == {"status": "success"}
    post_mock.assert_called_once_with(
        path,
        preview["vista_previa"],
        first_context.session.user_id,
    )


@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_confirmacion_despues_de_otro_turno_expira_sin_escribir(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
) -> None:
    """Un turno de usuario intermedio invalida la confirmación pendiente."""
    post_mock = Mock()
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    _, first_context = _prepare_preview(tool, arguments, post_mock)
    confirmation_id = "invocation-late-confirmation"
    events = [
        *first_context.session.events,
        SimpleNamespace(author="user", invocation_id="invocation-intermediate"),
        SimpleNamespace(author="user", invocation_id=confirmation_id),
    ]
    context = _context(
        session_id=first_context.session.id,
        user_id=first_context.session.user_id,
        invocation_id=confirmation_id,
        user_text="Confirmo",
        events=events,
        state=first_context.state,
    )

    result = _invoke(tool, context, arguments)

    assert result["status"] == "expired"
    post_mock.assert_not_called()


@pytest.mark.parametrize(
    ("changed_identity", "expected_session", "expected_user"),
    [
        pytest.param({"session_id": "other-session"}, "other-session", "user-test", id="sesion"),
        pytest.param({"user_id": "other-user"}, "session-test", "other-user", id="usuario"),
    ],
)
@pytest.mark.parametrize(
    ("tool", "arguments", "path"),
    _WRITES,
)
def test_identidad_distinta_no_puede_confirmar_preview(
    monkeypatch: pytest.MonkeyPatch,
    tool: Any,
    arguments: dict[str, Any],
    path: str,
    changed_identity: dict[str, str],
    expected_session: str,
    expected_user: str,
) -> None:
    """El preview queda ligado a la sesión y al usuario que lo originaron."""
    post_mock = Mock()
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    _, first_context = _prepare_preview(tool, arguments, post_mock)
    confirmation_id = "invocation-other-identity"
    context = _context(
        session_id=expected_session,
        user_id=expected_user,
        invocation_id=confirmation_id,
        user_text="Confirmo",
        events=[
            *first_context.session.events,
            SimpleNamespace(author="user", invocation_id=confirmation_id),
        ],
        state=first_context.state,
    )

    result = _invoke(tool, context, arguments)

    assert result["status"] == "error"
    post_mock.assert_not_called()


@pytest.mark.parametrize(
    "tool",
    [
        finanzas.registrar_tarjetas,
        finanzas.registrar_movimientos,
        finanzas.consultar_resumen,
        finanzas.consultar_calendario,
    ],
)
def test_lecturas_y_escrituras_no_aceptan_identidad_como_argumento(
    tool: Any,
) -> None:
    """Las herramientas no exponen parámetros para suplantar usuario o destinatario."""
    forbidden_names = {
        "user_id",
        "owner_sub",
        "ownerSub",
        "target_user",
        "target_user_id",
        "target_user_sub",
        "target_sub",
        "user_sub",
    }
    assert forbidden_names.isdisjoint(inspect.signature(tool).parameters)

    context = _context()
    for name in forbidden_names:
        with pytest.raises(TypeError):
            tool(tool_context=context, **{name: "forged-user"})


def test_identidad_de_la_escritura_proviene_de_session_user_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """El X-User-Sub de la escritura se obtiene del usuario autenticado de sesión."""
    post_mock = Mock(return_value={"status": "success"})
    monkeypatch.setattr(finanzas.FinanzasApiClient, "post", post_mock)
    preview, first_context = _prepare_preview(
        finanzas.registrar_tarjetas,
        _CARD_ARGUMENTS,
        post_mock,
        user_id="identity-from-session",
    )
    confirmation_id = "invocation-user-sub"
    context = _context(
        user_id="identity-from-session",
        invocation_id=confirmation_id,
        user_text="Confirmo",
        events=[
            *first_context.session.events,
            SimpleNamespace(author="user", invocation_id=confirmation_id),
        ],
        state=first_context.state,
    )

    result = _invoke(finanzas.registrar_tarjetas, context, _CARD_ARGUMENTS)

    assert result == {"status": "success"}
    post_mock.assert_called_once_with(
        "/api/finanzas/tarjetas",
        preview["vista_previa"],
        "identity-from-session",
    )
    assert preview["status"] == "preview"


def test_cliente_lecturas_usa_headers_auth_y_filtra_owner_sub(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """El cliente transmite identidad autenticada y elimina ownerSub recursivamente."""
    monkeypatch.setenv("FINANZAS_API_URL", "https://finanzas.invalid/")
    monkeypatch.setenv("FINANZAS_AGENT_TOKEN_URL", "https://auth.invalid/token")
    monkeypatch.setenv("FINANZAS_AGENT_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("FINANZAS_AGENT_CLIENT_SECRET", "test-only-secret")

    token_response = Mock()
    token_response.json.return_value = {"access_token": "test-only-access-token"}
    token_response.raise_for_status.return_value = None
    api_response = Mock()
    api_response.status_code = 200
    api_response.json.return_value = {
        "ownerSub": "private-owner",
        "Owner_Sub": "private-owner",
        "resumen": {"detalle": [{"owner-sub": "private-owner", "total": 1}]},
    }
    api_response.raise_for_status.return_value = None
    http = SimpleNamespace(
        post=Mock(return_value=token_response),
        get=Mock(return_value=api_response),
    )
    client = finanzas.FinanzasApiClient(http_client=http)

    summary = client.get(
        "/api/finanzas/movimientos/resumen-mensual",
        {"periodo": "2026-09"},
        "session-user-sub",
    )
    calendar = client.get(
        "/api/finanzas/calendario",
        {"desde": "2026-09-30", "dias": 14},
        "session-user-sub",
    )

    assert summary["status"] == "success"
    assert calendar["status"] == "success"
    assert summary["data"] == {
        "resumen": {"detalle": [{"total": 1}]}
    }
    assert calendar["data"] == summary["data"]
    assert http.post.call_count == 2
    assert http.post.call_args_list[0].args == ("https://auth.invalid/token",)
    assert http.post.call_args_list[0].kwargs["auth"] == (
        "test-client-id",
        "test-only-secret",
    )
    assert http.get.call_args_list[0].args == (
        "https://finanzas.invalid/api/finanzas/movimientos/resumen-mensual",
    )
    assert http.get.call_args_list[0].kwargs["params"] == {"periodo": "2026-09"}
    assert http.get.call_args_list[1].args == (
        "https://finanzas.invalid/api/finanzas/calendario",
    )
    assert http.get.call_args_list[1].kwargs["params"] == {
        "desde": "2026-09-30",
        "dias": 14,
    }
    for call in http.get.call_args_list:
        assert call.kwargs["headers"] == {
            "Authorization": "Bearer test-only-access-token",
            "X-User-Sub": "session-user-sub",
        }
        assert "test-only-secret" not in repr(call.kwargs["headers"])


def test_herramientas_de_lectura_usan_endpoint_y_usuario_de_sesion(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Las consultas financieras solicitan rutas y parámetros de dominio correctos."""
    get_mock = Mock(return_value={"status": "success", "data": {}})
    monkeypatch.setattr(finanzas.FinanzasApiClient, "get", get_mock)
    context = _context(user_id="read-user-from-session")

    summary = finanzas.consultar_resumen("2026-09", context)
    calendar = finanzas.consultar_calendario("2026-09-30", 14, context)

    assert summary["status"] == "success"
    assert calendar["status"] == "success"
    assert get_mock.call_args_list == [
        (
            (
                "/api/finanzas/movimientos/resumen-mensual",
                {"periodo": "2026-09"},
                "read-user-from-session",
            ),
            {},
        ),
        (
            (
                "/api/finanzas/calendario",
                {"desde": "2026-09-30", "dias": 14},
                "read-user-from-session",
            ),
            {},
        ),
    ]


@pytest.mark.parametrize(
    ("failure_stage", "status_code"),
    [
        pytest.param("token", None, id="fallo-token"),
        pytest.param("api", 502, id="fallo-api"),
    ],
)
def test_errores_no_revelan_token_secret_body_ni_headers(
    monkeypatch: pytest.MonkeyPatch,
    failure_stage: str,
    status_code: int | None,
) -> None:
    """Los mensajes de fallo no contienen credenciales ni detalles remotos."""
    monkeypatch.setenv("FINANZAS_API_URL", "https://finanzas.invalid")
    monkeypatch.setenv("FINANZAS_AGENT_TOKEN_URL", "https://auth.invalid/token")
    monkeypatch.setenv("FINANZAS_AGENT_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("FINANZAS_AGENT_CLIENT_SECRET", "test-only-secret-marker")
    if failure_stage == "token":
        http = SimpleNamespace(
            post=Mock(
                side_effect=RuntimeError(
                    "test-only-access-token-marker test-only-secret-marker"
                )
            ),
            get=Mock(),
        )
    else:
        token_response = Mock()
        token_response.json.return_value = {
            "access_token": "test-only-access-token-marker"
        }
        token_response.raise_for_status.return_value = None
        failed_response = Mock()
        failed_response.status_code = status_code
        failed_response.raise_for_status.side_effect = RuntimeError(
            "test-only-body-marker test-only-header-marker "
            "test-only-access-token-marker test-only-secret-marker"
        )
        http = SimpleNamespace(
            post=Mock(side_effect=[token_response, failed_response]),
            get=Mock(return_value=failed_response),
        )

    result = finanzas.FinanzasApiClient(http_client=http).get(
        "/api/finanzas/calendario",
        {"desde": "2026-09-30", "dias": 1},
        "session-user-sub",
    )

    assert result["status"] == "error"
    rendered_result = repr(result)
    for marker in (
        "test-only-access-token-marker",
        "test-only-secret-marker",
        "test-only-body-marker",
        "test-only-header-marker",
    ):
        assert marker not in rendered_result
    if failure_stage == "api":
        api_headers = http.get.call_args.kwargs["headers"]
        assert api_headers == {
            "Authorization": "Bearer test-only-access-token-marker",
            "X-User-Sub": "session-user-sub",
        }
        assert "test-only-secret-marker" not in repr(api_headers)
        assert "test-only-body-marker" not in repr(api_headers)
        assert "test-only-header-marker" not in repr(api_headers)
    if status_code is not None:
        assert str(status_code) in result["mensaje"]

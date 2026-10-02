"""Orquestador del lab: atiende al usuario y delega en agentes especialistas.

Autor: Daniel Tovar
Desde: 2026-09-30
Modificado: Daniel Tovar 2026-09-30 — delegación al agente financiero.
Modificado: Daniel Tovar 2026-10-01 - role-aware LiteLLM routing.
"""
from google.adk.agents import LlmAgent
from google.genai import types
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .finanzas import finanzas_agent
from .model_router import RoleAwareLiteLlm


def obtener_hora(zona_horaria: str) -> dict[str, str]:
    """Devuelve la fecha y hora actual en una zona horaria.

    Úsala cuando el usuario pregunte qué hora es en una ciudad o país.

    Args:
        zona_horaria: Nombre IANA de la zona, por ejemplo "America/Mexico_City" o "Asia/Tokyo".

    Returns:
        dict con "status" ("success" o "error") y la hora o el mensaje de error.
    """
    try:
        ahora = datetime.now(ZoneInfo(zona_horaria))
    except ZoneInfoNotFoundError:
        return {"status": "error", "mensaje": f"Zona horaria no válida: {zona_horaria}"}
    return {"status": "success", "zona_horaria": zona_horaria, "hora": ahora.strftime("%Y-%m-%d %H:%M")}

root_agent = LlmAgent(
    model=RoleAwareLiteLlm(model="role-aware-router"),
    name="orquestador",
    tools=[obtener_hora],
    sub_agents=[finanzas_agent],
    description=(
        "Asistente de finanzas personales del lab: gastos, gastos fijos, sueldo, "
        "tarjetas de crédito, movimientos, resumen y calendario. También traduce "
        "y ayuda con programación."
    ),
    instruction=(
        "Responde en español, claro y breve: máximo 150 palabras salvo que el usuario pida detalle. "\
        "Temas: finanzas personales, educación financiera, traducción y programación. "
        "Transfiere al agente finanzas cuando el usuario trate tarjetas, movimientos, "
        "resúmenes o calendario, especialmente consultas o registros de sus datos. "
        "Si piden algo fuera de esos temas, dilo con amabilidad y no respondas. "
        "No afirmes que consultaste o guardaste datos financieros si no lo hizo el agente finanzas. "
        "Nunca inventes montos, tasas ni fechas. "
        "Cuando hables de inversiones o de pagar la tarjeta, explica conceptos, opciones y costos; "
        "aclara que es educativo y no una recomendación personalizada."
    ),
    generate_content_config=types.GenerateContentConfig(temperature=0.2),
)
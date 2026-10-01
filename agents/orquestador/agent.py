"""Orquestador del lab: atiende al usuario y delega en agentes especialistas.

Autor: Daniel Tovar
Desde: 2026-09-30
"""
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.genai import types
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

def obtener_hora(zona_horaria: str) -> dict:
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
    model=LiteLlm(model="deepseek/deepseek-flash"),
    name="orquestador",
    tools=[obtener_hora],
    description=(
        "Asistente de finanzas personales del lab: gastos, gastos fijos, sueldo, "
        "tarjeta de crédito e inversiones. También traduce y ayuda con programación."
    ),
    instruction=(
        "Responde en español, claro y breve: máximo 150 palabras salvo que el usuario pida detalle. "\
        "Temas: finanzas personales, educación financiera, traducción y programación. "
        "Si piden algo fuera de esos temas, dilo con amabilidad y no respondas. "
        "Todavía no tienes acceso a los gastos, sueldo ni movimientos del usuario: "
        "si te preguntan por sus datos, dilo y explica qué podrá hacer Lara cuando los importe. "
        "Nunca inventes montos, tasas ni fechas. "
        "Cuando hables de inversiones o de pagar la tarjeta, explica conceptos, opciones y costos; "
        "aclara que es educativo y no una recomendación personalizada."
    ),
    generate_content_config=types.GenerateContentConfig(temperature=0.2),
)
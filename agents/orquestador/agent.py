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
        "Asistente personal del lab: banca, educación financiera y programación. "
        "Atiende al usuario y delega en agentes especialistas."
    ),
    instruction=(
        "Responde en español, breve y claro. "
        "Temas permitidos: banca, educación financiera y programación. "
        "Si el usuario pide algo fuera de esos temas, dilo con amabilidad y no respondas. "
        "explica conceptos y opciones de inversión."
    ),
    generate_content_config=types.GenerateContentConfig(temperature=0.2),
)
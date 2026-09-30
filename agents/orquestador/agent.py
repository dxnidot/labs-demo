"""Orquestador del lab: atiende al usuario y delega en agentes especialistas.

Autor: Daniel Tovar
Desde: 2026-09-30
"""
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.genai import types

root_agent = LlmAgent(
    model=LiteLlm(model="deepseek/deepseek-flash"),
    name="orquestador",
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
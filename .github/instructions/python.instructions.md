---
applyTo: "**/*.py"
---

- Añade type hints; los docstrings siguen las reglas de abajo.
- Para agentes ADK, usa `LiteLlm` con DeepSeek.
- Obtén los secretos únicamente de variables de entorno; no los incluyas en el código.
- Solo en módulos nuevos, inicia el docstring del módulo con un propósito de una línea y luego las líneas `Autor: Daniel` y `Desde: YYYY-MM-DD`.
- Al editar un módulo existente, no cambies `Autor`; añade o actualiza `Modificado: Daniel YYYY-MM-DD` con una nota breve.
- Mantén docstrings para funciones públicas y herramientas ADK; el modelo lee la docstring de la herramienta para decidir cuándo llamarla.

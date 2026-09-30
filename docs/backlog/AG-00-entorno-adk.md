# AG-00 · Entorno: PYTHONUTF8, venv, google-adk[a2a], litellm>=1.84 (Módulo 0)

- Estado: Hecho
- Prioridad: Alta
- Parte del lab: Módulo 0
- Depende de: —
- Fecha: 2026-09-30
- Contexto: El entorno local debe cumplir la base del laboratorio para evitar errores del sistema operativo, problemas con el modelo y conflictos de dependencia. La instalación debe hacerse con un entorno aislado y sin secretos en el código.
- Criterio de aceptación:
  - `python --version` devuelve la versión del entorno local y `python -m venv agents/.venv` crea el entorno virtual del proyecto.
  - `..venv\Scripts\Activate.ps1` y `pip install "google-adk[a2a]" "litellm>=1.84"` concluyen sin errores de instalación.
  - `adk --version` devuelve un número de versión y confirma que la instalación de ADK quedó activa.
- Archivos relevantes:
  - .gitignore
  - docs/plans/estado-lab.md
- Notas:
  - Confirmado: `PYTHONUTF8=1` es importante en Windows para evitar problemas de Unicode en LiteLLM.
  - Inferido: no se deben guardar claves ni secretos dentro del código ni en el repositorio público.
  - Confirmado: google-adk 2.10.0 y litellm 1.103.1 instalados; versiones en agents/requirements.txt.
  - Cerrado: 2026-09-30.

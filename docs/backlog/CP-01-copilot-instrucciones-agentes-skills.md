# CP-01 · Instrucciones, agentes y skills de Copilot (A.1)

- Estado: Pendiente
- Prioridad: Alta
- Parte del lab: A.1
- Depende de: —
- Fecha: 2026-09-30
- Contexto: El laboratorio necesita una capa de contexto fija para Copilot, con instrucciones específicas por lenguaje y agentes especializados. Esto reduce tokens, alinea convenciones y evita decisiones improvisadas durante la programación.
- Criterio de aceptación:
  - `find .github -maxdepth 2 -type f | sort` devuelve la estructura `.github/copilot-instructions.md`, `instructions/` y `agents/`.
  - `grep -R "applyTo\|keycloak-lab\|test-engineer\|keycloak-security" .github` encuentra las reglas y los agentes definidos.
  - `git diff -- .github` muestra solo la creación o cambios del conjunto de instrucciones del repositorio.
- Archivos relevantes:
  - .github/
  - docs/plans/estado-lab.md
- Notas:
  - Confirmado: la configuración del repo debe usar la mínima superficie posible y reglas claras.
  - Inferido: los agentes deben responder en español y seguir la convención del laboratorio.
  - Pendiente: validar el contenido exacto de los archivos con la doc oficial de Copilot antes de cerrar la implementación final.

# CP-03 · Skill de dominio finanzas-dominio para Copilot

- Estado: Hecho
- Prioridad: Media
- Parte del lab: .github (Copilot)
- Depende de: —
- Fecha: 2026-09-30
- Contexto: Definir reglas genéricas compartidas para las funciones financieras de Lara y cargarlas en los agentes Java, React y Python pertinentes.
- Criterio de aceptación:
  - `SKILL.md` usa el formato oficial de skills de VS Code y el nombre coincide con el directorio.
  - Las reglas cubren cuentas, aportaciones, alertas de caída, calendario de tarjetas, privacidad y recomendaciones educativas.
  - Los tres agentes pertinentes y la tabla de skills de Copilot referencian `finanzas-dominio`.
  - El contenido público no incluye datos financieros reales ni nombres de intermediarios o entidades.
- Archivos relevantes: `.github/skills/finanzas-dominio/SKILL.md`, `.github/agents/`, `.github/copilot-instructions.md`
- Notas:
  - Confirmado: la documentación oficial de VS Code define `name` y `description` en YAML frontmatter y exige que `name` coincida con el directorio.
  - Confirmado: skill creada y referenciada en java-spring, react-ts, python-adk y copilot-instructions.
  - Cerrado: 2026-09-30

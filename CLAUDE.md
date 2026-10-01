# Instrucciones para Claude Code

Sigue las reglas del repo:
@.github/copilot-instructions.md
@.github/instructions/typescript.instructions.md

- Para UI: guía visual en docs/design/lara/README.md; lee el PNG del mockup y compara el resultado contra él.
- Skills de referencia en .github/skills/ (vercel-react-best-practices, typescript-advanced-types, finanzas-dominio).
- Muestra el diff antes de aplicar. Nunca hagas commit ni push.

## UI de Lara

- Guía: docs/design/lara/README.md (tokens, pantallas y reglas).
- Medidas exactas: docs/design/lara/html/src/<NN>-<pantalla>.html y docs/design/lara/html/src/_shell.css (fuente legible; lara-canvas.html es el original empaquetado). Aspecto: docs/design/lara/png/<NN>-<pantalla>.png.
- Antes de construir una pantalla lee su PNG de docs/design/lara/png/ y compara el resultado contra él; lista las diferencias.
- Capturas de la app en ejecución: .capturas/<nombre>.png (ignorado por git).
- Tokens solo desde agents-ui/src/index.css; nunca colores sueltos en componentes.

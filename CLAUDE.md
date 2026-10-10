# Instrucciones para Claude Code

Sigue las reglas del repo:
@.github/copilot-instructions.md
@.github/instructions/typescript.instructions.md

- Para UI: guía visual en docs/design/lara/README.md; lee el PNG del mockup y compara el resultado contra él.
- Skills de referencia en .github/skills/ (vercel-react-best-practices, typescript-advanced-types, finanzas-dominio).

## UI de Lara

- Guía: docs/design/lara/README.md (tokens, pantallas y reglas).
- Medidas exactas: docs/design/lara/html/src/<NN>-<pantalla>.html y docs/design/lara/html/src/_shell.css (fuente legible; lara-canvas.html es el original empaquetado). Aspecto: docs/design/lara/png/<NN>-<pantalla>.png.
- Antes de construir una pantalla lee su PNG de docs/design/lara/png/ y compara el resultado contra él; lista las diferencias.
- Reglas compartidas (tokens, localStorage, mocks y datos de relleno, capturas): sección «UI de Lara y datos de relleno» de `.github/copilot-instructions.md`, importado arriba.

## Skills de diseño

Instaladas con `npx skills` (verifica con /skills cuáles están disponibles; si una no está, dilo y no la inventes).

- **Impeccable** (pbakaus/impeccable): base del sistema visual y revisión. Úsala para auditar, criticar y pulir. Ejecuta `/teach-impeccable` una sola vez con este contexto: producto de finanzas personales de uso diario, tono sobrio y claro, tema claro y oscuro, un solo usuario.
- **Emil Kowalski** (emilkowalski/skills): animación e interacción fina. Solo en la fase de motion, después de que el diseño base esté cerrado.
- **Taste** (Leonxlnx/taste-skill): usa solo `redesign-skill` (auditar antes de cambiar) y `output-skill` (no dejar código a medias ni placeholders). NO uses su skill principal junto con Impeccable: fijan dirección visual y se contradicen.

Precedencia: la guía visual de Lara (README, PNG de mockups, tokens de index.css) manda sobre cualquier skill. Si una skill sugiere algo que contradice esa guía, no lo apliques en silencio: repórtalo y pregunta.

Motion: CSS, duraciones cortas, easing coherente y respeto a `prefers-reduced-motion`. No agregues una librería de animación sin preguntar.

Verificación visual: compara antes y después con capturas en .capturas/ cuando sea posible.

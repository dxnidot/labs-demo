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

Versionadas en `.claude/skills/` y registradas en `skills-lock.json` (licencias en `.claude/licenses/`). Si una no aparece en /skills, dilo y no la inventes.

- **Impeccable** (pbakaus/impeccable, v4.5.2): base del sistema visual y revisión. Úsala para auditar, criticar y pulir. Su comando de contexto es `.claude/skills/impeccable/scripts/impeccable context`; el de producto es `init` (alias `teach`), que se invoca como `/impeccable init` y solo genera PRODUCT.md. No generes DESIGN.md (la fuente visual es docs/design/lara/) y no ejecutes su comando `hooks`.
- **Emil Kowalski** (emilkowalski/skills): animación e interacción fina, solo en la fase de motion y después de que el diseño base esté cerrado. Instaladas: `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `emil-design-eng`, `animation-vocabulary`, `break-ui`, `prototype` y `apple-design`.
- **Taste** (Leonxlnx/taste-skill): usa solo `redesign-existing-projects` (auditar antes de cambiar) y `full-output-enforcement` (no dejar código a medias ni placeholders). NO instales ni uses su skill principal junto con Impeccable: fijan dirección visual y se contradicen.

Ignora el tono "go all out / dream big and bold" de Impeccable: Lara es sobria; manda la guía visual de docs/design/lara/ y los tokens de index.css.

Precedencia: la guía visual de Lara (README, PNG de mockups, tokens de index.css) manda sobre cualquier skill. Si una skill sugiere algo que contradice esa guía, no lo apliques en silencio: repórtalo y pregunta.

Motion: CSS, duraciones cortas, easing coherente y respeto a `prefers-reduced-motion`. No agregues una librería de animación sin preguntar.

Verificación visual: compara antes y después con capturas en .capturas/ cuando sea posible.

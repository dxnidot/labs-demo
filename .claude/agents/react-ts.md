---
name: react-ts
description: Implements UI work in apps/lara-web/ (React, Vite, TypeScript, Tailwind v4). Use for any change under apps/lara-web/.
model: sonnet
---

You implement and maintain the Lara UI in `apps/lara-web/` (React, Vite, TypeScript, Tailwind v4).

Always answer in Spanish.

## Scope

- Work only inside `apps/lara-web/`. Do not edit any other folder.
- Run `npm` only from `apps/lara-web/`.

## References

- Follow `CLAUDE.md` and `docs/design/lara/README.md`.
- Use tokens only from `apps/lara-web/src/index.css`; never put loose colors in components.
- When building or changing a screen, read the mockup PNG from `docs/design/lara/png/<NN>-*.png` with Read, and read exact measurements from `docs/design/lara/html/src/<NN>-*.html` and `docs/design/lara/html/src/_shell.css`. The PNG decides the look; the HTML decides the measurements.
- For screenshots of the running app, read them from `.capturas/<name>.png`.

## Code rules

- Light hexagonal architecture: ports and adapters for data, plain React components for the UI.
- No `any`. No `localStorage`. Never `dangerouslySetInnerHTML`.
- JSDoc with `@author Daniel Tovar` on components, hooks, ports, adapters and use cases.
- Add or update Vitest tests for every change.

## Workflow

- Show the diff before applying it, and wait for approval.
- Never commit.

# Instrucciones del repo labs-demo

Laboratorio personal en Windows (`D:\dev\labs`, PowerShell). Repo **público**. Responde siempre en español.

## Mapa del monorepo

| Carpeta                 | Qué es                                                                                                                 | Puerto |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| `infra/keycloak/`       | Keycloak 26 + PostgreSQL (Docker Compose), realm `lab`                                                                 | 8080   |
| `services/kc-menu/`     | API Spring Boot 4, Java 21, valida JWT y arma el menú por rol                                                          | 8081   |
| `services/kc-finanzas/` | API Spring Boot 4, Java 21, finanzas personales con PostgreSQL (Docker Compose, BD en 5433)                            | 8083   |
| `bpm-sync/`             | Sincronización BPM → Keycloak (pendiente)                                                                              | —      |
| `agents/`               | Agentes ADK: orquestador Python (8000, API server 8010), cálculos financieros Java (8002), traductor TypeScript (8003) | varios |
| `apps/lara-web/`        | Lara: UI en React + Vite + Tailwind con login de Keycloak                                                              | 5173   |
| `docs/`                 | Backlog, ADR, planes y guía de UI                                                                                      | —      |

## Reglas de trabajo

- Muestra el plan o el diff **antes** de crear o modificar archivos. Espera aprobación, salvo que el prompt de la tarea defina otro flujo de forma explícita.
- **Nunca** hagas commit ni push, salvo que el prompt de la tarea lo autorice de forma explícita (solo en la rama indicada).
- Antes de afirmar cómo funciona una librería, verifica la versión instalada y la doc oficial (skill `verificar-docs-oficiales`). Di qué URL usaste.
- Separa lo **Confirmado**, lo **Inferido** y lo **Pendiente**.
- Propón primero la solución más simple y mantenible. Si comparas opciones, di cuál conviene y por qué.
- Código limpio para Sonar: sin código muerto, sin `if` anidados innecesarios, nombres claros.
- Cambia solo lo que se pidió. No toques otras carpetas del monorepo, salvo que la tarea lo indique.

## Estado del backlog
- Al aprobarse el plan de una historia: cambia su Estado a "En curso" en su archivo de docs/backlog/, en docs/backlog/README.md y en docs/plans/estado-lab.md (🔄).
- Al terminar y validar: propone cambiarla a "Hecho" (✅), reemplazando cada "Pendiente" de sus Notas por un "Confirmado" que diga cómo se resolvió, más "Cerrado: <fecha>". Si solo se hizo una parte, déjala "En curso" y di qué falta.
- Actualiza "Última actualización" en estado-lab.md.
- Estos cambios de estado son la única excepción a "no tocar otras carpetas".

## Arquitectura

- Convención del lab: **hexagonal ligera** (puertos y adaptadores): `domain/`, `application/ports`, `application/use-cases`, `infrastructure/adapters`, `ui/`.
- La skill `clean-architecture` es referencia de principios; si choca con esta convención, gana la convención.
- En React: la hexagonal aplica a la capa de datos (puertos como `AuthPort`, `AgentePort`; adaptadores para Keycloak y ADK). Los componentes siguen siendo React normal (componentes + hooks); no crear capas extra en la UI.

## UI de Lara y datos de relleno

- Tokens solo desde `apps/lara-web/src/index.css`; nunca colores sueltos en componentes.
- `localStorage` está prohibido, con una única excepción: la clave `"lara.fuente"` (fuente elegida en Apariencia; preferencia visual no sensible), siempre con `try/catch` y valor por defecto IBM Plex Sans. Nada más va a `localStorage`, tampoco los mocks.
- Donde falte backend, usa adaptadores mock que cumplan los mismos puertos que los reales, en una carpeta separada y seleccionados con `VITE_USE_MOCKS`. Los componentes nunca llevan datos inline.
- `VITE_USE_MOCKS=true` por defecto en `.env.example`; la config real va en `.env.local` (ignorado por Git). Marca cada mock con `// MOCK` y muestra un indicador visual discreto cuando el modo mock esté activo.
- Los datos de relleno son ficticios: ningún dato real, secreto, token ni contraseña, ni siquiera "parecidos" a los reales (repo público).
- Capturas de la app en ejecución: `.capturas/<nombre>.png` (ignorado por Git).

## Seguridad (repo público)

- Nada de secrets, tokens, contraseñas ni `.env` en código, docs o respuestas. Usa variables de entorno.
- Nada del trabajo del autor: ni nombres de personas, empresas, bancos ni productos internos.
- Tokens solo en memoria en el front. Nunca `innerHTML` / `dangerouslySetInnerHTML` con datos de la API o del agente.
- Datos locales (sesiones SQLite, finanzas) viven en `agents/data/` y están ignorados por Git.
- Keycloak: nunca `docker compose down -v`.

## Logs y trazas

- Usa el `traceId` del contexto; no generes IDs propios.
- Loguea solo: `ERROR` con causa, `WARN` de recuperaciones o rechazos, `INFO` de hechos de negocio con conteos.
- Nunca loguees tokens, secrets, contraseñas, bodies completos ni prompts completos.
- Ver [docs/decisions/0004-trazabilidad-y-logs.md](../docs/decisions/0004-trazabilidad-y-logs.md).

## Documentación

No la leas completa; abre solo el archivo que la tarea necesita.

- Backlog por historias: `docs/backlog/README.md` (índice) y un archivo por ID (`AG-01`, `UI-02`…).
- Avance: `docs/plans/estado-lab.md`.
- Decisiones: `docs/decisions/` (ADR).
- Guía visual de Lara: `docs/design/lara/README.md`.
- `docs/private/` es privado: nunca lo cites ni lo enlaces desde archivos públicos.

## Skills disponibles (`.github/skills/`)

| Skill                         | Úsala cuando                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `keycloak-lab`                | Levantar o detener el lab, puertos, realm, usuarios, sacar tokens             |
| `verificar-docs-oficiales`    | Antes de afirmar versiones, APIs o comandos de cualquier librería             |
| `java-springboot`             | Código en `kc-menu`, `kc-finanzas`, `bpm-sync` o el agente Java               |
| `clean-architecture`          | Diseñar capas, puertos y dependencias (respetando la convención hexagonal)    |
| `system-design`               | Decisiones entre servicios: A2A, API server, persistencia, flujos             |
| `python-design-patterns`      | Código del orquestador y agentes en Python                                    |
| `typescript-advanced-types`   | Tipos en `lara-web` o el agente TypeScript                                    |
| `vercel-react-best-practices` | Componentes, hooks y rendimiento en `lara-web`                                |
| `finanzas-dominio`            | Reglas de finanzas personales para el servicio, vistas y herramientas de Lara |
| `find-skills`                 | Buscar una skill nueva cuando ninguna de estas aplica                         |

Las skills de diseño (Impeccable, nueve de Emil Kowalski y, de Taste, `redesign-existing-projects` y `full-output-enforcement`) viven en `.claude/skills/`, están versionadas y registradas en `skills-lock.json`, y son para Claude Code; el comando de contexto de Impeccable es `impeccable context` (`.claude/skills/impeccable/scripts/impeccable`) y sus reglas de uso están en `CLAUDE.md`. La guía visual de Lara (README, PNG de mockups y tokens de `index.css`) manda sobre cualquier skill.

## Commits (cuando el autor los pida o el prompt de la tarea los autorice)

Conventional commits en español: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`. Ejemplo: `docs: backlog del lab por historias`.

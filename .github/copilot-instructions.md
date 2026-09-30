# Instrucciones del repo labs-demo

Laboratorio personal en Windows (`D:\dev\labs`, PowerShell). Repo **público**. Responde siempre en español.

## Mapa del monorepo

| Carpeta      | Qué es                                                                                                    | Puerto |
| ------------ | --------------------------------------------------------------------------------------------------------- | ------ |
| `keycloak/`  | Keycloak 26 + PostgreSQL (Docker Compose), realm `lab`                                                    | 8080   |
| `kc-demo/`   | API Spring Boot 4, Java 21, valida JWT y arma el menú por rol                                             | 8081   |
| `kc-front/`  | Front Angular (se va a absorber en Lara, ver ADR-0002)                                                    | 4200   |
| `bpm-sync/`  | Sincronización BPM → Keycloak (pendiente)                                                                 | —      |
| `agents/`    | Agentes ADK: orquestador Python (8000, API server 8010), aclaraciones Java (8002), menu TypeScript (8003) | varios |
| `agents-ui/` | Lara: UI en React + Vite + Tailwind con login de Keycloak                                                 | 5173   |
| `docs/`      | Backlog, ADR, planes y guía de UI                                                                         | —      |

## Reglas de trabajo

- Muestra el plan o el diff **antes** de crear o modificar archivos. Espera aprobación.
- **Nunca** hagas commit ni push.
- Antes de afirmar cómo funciona una librería, verifica la versión instalada y la doc oficial (skill `verificar-docs-oficiales`). Di qué URL usaste.
- Separa lo **Confirmado**, lo **Inferido** y lo **Pendiente**.
- Propón primero la solución más simple y mantenible. Si comparas opciones, di cuál conviene y por qué.
- Código limpio para Sonar: sin código muerto, sin `if` anidados innecesarios, nombres claros.
- Cambia solo lo que se pidió. No toques otras carpetas del monorepo.

## Arquitectura

- Convención del lab: **hexagonal ligera** (puertos y adaptadores): `domain/`, `application/ports`, `application/use-cases`, `infrastructure/adapters`, `ui/`.
- La skill `clean-architecture` es referencia de principios; si choca con esta convención, gana la convención.
- En React: la hexagonal aplica a la capa de datos (puertos como `AuthPort`, `AgentePort`; adaptadores para Keycloak y ADK). Los componentes siguen siendo React normal (componentes + hooks); no crear capas extra en la UI.

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

| Skill                         | Úsala cuando                                                               |
| ----------------------------- | -------------------------------------------------------------------------- |
| `keycloak-lab`                | Levantar o detener el lab, puertos, realm, usuarios, sacar tokens          |
| `verificar-docs-oficiales`    | Antes de afirmar versiones, APIs o comandos de cualquier librería          |
| `java-springboot`             | Código en `kc-demo`, `bpm-sync` o el agente Java                           |
| `clean-architecture`          | Diseñar capas, puertos y dependencias (respetando la convención hexagonal) |
| `system-design`               | Decisiones entre servicios: A2A, API server, persistencia, flujos          |
| `python-design-patterns`      | Código del orquestador y agentes en Python                                 |
| `typescript-advanced-types`   | Tipos en `agents-ui`, `kc-front` o el agente TypeScript                    |
| `vercel-react-best-practices` | Componentes, hooks y rendimiento en `agents-ui`                            |
| `find-skills`                 | Buscar una skill nueva cuando ninguna de estas aplica                      |

## Commits (cuando el autor los pida)

Conventional commits en español: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`. Ejemplo: `docs: backlog del lab por historias`.

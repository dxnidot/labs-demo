# KC-04 · Roles de Keycloak para catálogo LLM por rol y audience del access token

- Estado: En curso
- Prioridad: Alta
- Parte del lab: Identidad / Agentes
- Depende de: KC-02
- Fecha: 2026-10-01
- Contexto: `agents/orquestador` ya enruta modelos LLM y filtra el Sidebar de Lara según los roles del JWT (`llm_basic`/`llm_advanced` para el catálogo de modelos; `ver_agentes`/`ver_identidad`/`usar_finanzas` para las secciones del Sidebar). El código ya existe y tiene tests; lo que falta es la configuración manual en el realm `lab` de Keycloak, que no se puede versionar porque no hay `realm-export.json` en el repo (ver KC-03).
- Cambios en Keycloak (realm `lab`, consola admin `http://localhost:8080/admin`):

  1. **Audience mapper en el client `agents-ui`** — Confirmado, hecho en esta sesión:
     - **Clients → `agents-ui` → Client scopes → `agents-ui-dedicated`**.
     - **Mappers → Add mapper → By configuration → Audience** (no "By predefined mapper"; "Audience" no aparece en esa lista).
     - Config: Name `audience-agents-ui`, **Included Client Audience**: `agents-ui`, **Add to access token**: On.
     - Motivo: `agents/orquestador/auth.py` valida que el claim `aud` del JWT sea exactamente `KEYCLOAK_AUDIENCE` (`agents-ui`). Sin este mapper, Keycloak no mete el client id en `aud` por defecto y todas las requests fallaban con 401.
     - Importante: hay que cerrar sesión y volver a loguearse en Lara para obtener un token nuevo con el `aud` correcto; los tokens ya emitidos antes del mapper no lo tienen.

  2. **5 realm roles nuevos** — Pendiente, no confirmado en esta sesión:
     - `llm_basic` — catálogo básico de modelos (Gemini 3.8 Flash, DeepSeek Flash).
     - `llm_advanced` — catálogo básico + avanzado (+ DeepSeek V4 Pro, Gemini 3.1 Pro). El código también trata `admin` y `premium` como avanzado.
     - `ver_agentes` — Sidebar: sección AGENTES (Agentes, Base de datos, Memoria vectorizada, Herramientas MCP).
     - `ver_identidad` — Sidebar: sección IDENTIDAD (Menú por rol, Usuarios y roles, Sincronización BPM).
     - `usar_finanzas` — Sidebar: sección PERSONAL · SOLO LOCAL (Finanzas, Gastos fijos).
     - Nombrados en snake_case (no kebab-case como `ver-menu`/`autorizar`) porque así ya están escritos literalmente en `agents/orquestador/model_router.py` y en los hooks de `agents-ui`; cambiar la convención implicaría tocar ese código.
     - Nota: ya existe un *client role* `usar-finanzas` bajo el client `finanzas-agent` (solo para su service account, ver FIN-13). No choca con el nuevo *realm role* `usar_finanzas` porque son roles distintos en ámbitos distintos, pero puede confundir en la consola.
     - Pasos: **Realm roles → Create role** (×5) → **Users → `ana`/`beto`/admin → Role mapping → Assign role**.
- Archivos relevantes:
  - `agents/orquestador/model_router.py`, `auth.py`, `api.py`
  - `agents-ui/src/ui/useHasRole.ts`, `AppShell.tsx`
- Notas:
  - Confirmado: sin el audience mapper, toda request al orquestador devolvía 401 aunque el token fuera válido y Keycloak respondiera bien (JWKS verificado con `curl` contra `/realms/lab/protocol/openid-connect/certs`, 200 OK con clave de firma RSA presente).
  - Pendiente: crear y asignar los 5 realm roles; sin ellos, cualquier usuario cae al catálogo básico por defecto y no ve ninguna de las tres secciones del Sidebar.
  - Pendiente: KC-03 (realm como código) dejaría estos roles versionados en un `realm-export.json`, en vez de solo en el volumen de Postgres de Keycloak.

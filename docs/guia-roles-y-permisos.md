# Guía: de un usuario de Keycloak a lo que puede ver/usar en Lara

Esta guía explica, de punta a punta, cómo un rol asignado a un usuario en Keycloak termina decidiendo qué modelos de LLM puede usar y qué partes del Sidebar de Lara puede ver. Para los pasos manuales exactos ya ejecutados y los que faltan, ver [`KC-04`](backlog/KC-04-roles-llm-y-audience.md).

## 0. Requisito previo: el audience mapper

Antes de que CUALQUIER rol importe, el token tiene que pasar la verificación de `agents/orquestador/auth.py`. Eso exige que el claim `aud` del JWT sea `agents-ui` — si el client `agents-ui` en Keycloak no tiene el mapper de Audience configurado (`Clients → agents-ui → Client scopes → agents-ui-dedicated → Mappers → Add mapper → By configuration → Audience`), **todo** falla con 401 sin importar los roles. Ver `KC-04` punto 1.

## 1. Crear un usuario en Keycloak

1. `http://localhost:8080/admin` → realm `lab` (arriba a la izquierda, no `master`).
2. **Users → Add user**. Username, dar **Save**.
3. Pestaña **Credentials → Set password** (desactivar "Temporary" si no quieres que pida cambiarla).

## 2. Asignarle un rol

1. En el mismo usuario, pestaña **Role mapping → Assign role**.
2. Filtra por **Filter by realm roles** (no "Filter by clients") y marca el rol que quieras.
3. El usuario necesita cerrar sesión y volver a entrar en Lara para que el nuevo token traiga el rol — un token ya emitido no se actualiza solo.

Si el rol todavía no existe, créalo primero en **Realm roles → Create role** (nombre exacto, sensible a mayúsculas/guiones — ver tabla abajo).

## 3. Qué rol desbloquea qué, y dónde está en el código

### Catálogo de modelos LLM

| Rol en Keycloak | Qué agrega al catálogo | Constante en el código |
| --- | --- | --- |
| *(ninguno)* | Solo el modelo seguro por defecto | `DEFAULT_MODEL` — `agents/orquestador/model_router.py:23` (`gemini/gemini-3.8-flash`) |
| `llm_basic` | + modelos básicos | `_BASIC_ROLES` → `_BASIC_MODELS` — `model_router.py:24` y `:61` (`gemini-3.8-flash`, `deepseek-flash`) |
| `llm_advanced` | + modelos básicos y avanzados | `_ADVANCED_ROLES` → `_BASIC_MODELS + _ADVANCED_MODELS` — `model_router.py:25` y `:65` (`deepseek-v4-pro`, `gemini-3.1-pro`) |
| `admin` o `premium` | Igual que `llm_advanced` | Ya están incluidos en `_ADVANCED_ROLES` (`model_router.py:25`) — no hace falta asignar `llm_advanced` aparte si el usuario ya es `admin`/`premium` |

Flujo completo: `auth.py: extract_roles()` lee `realm_access.roles` + todos los `resource_access.*.roles` del JWT → `api.py` arma el `ModelContext` con esos roles → `model_router.get_allowed_models(roles)` decide el catálogo → el endpoint `GET /api/llm/available-models` (`api.py`, handler `listar_modelos_disponibles`) se lo manda al front → `agents-ui/src/ui/ChatPage.tsx` lo pinta en el `<SelectorModelo>` del header del chat.

Cuando el usuario envía un mensaje, el modelo elegido viaja en la cabecera `X-LLM-Model` (`agents-ui/src/infrastructure/adapters/AdkAgenteAdapter.ts`, método `enviarMensaje`) y el middleware de `api.py` lo vuelve a validar contra el catálogo del usuario antes de dejarlo pasar — un usuario no puede forzar un modelo fuera de su catálogo editando el front.

### Secciones del Sidebar

| Rol en Keycloak | Qué desbloquea | Dónde está en el código |
| --- | --- | --- |
| `ver_agentes` (o `admin`) | Sección **AGENTES**: Agentes, Base de datos, Memoria vectorizada, Herramientas MCP | `agents-ui/src/ui/AppShell.tsx:164` (`puedeVerAgentes`), usado en el Sidebar (`:309`) y en las rutas (`:466`–`:472`) |
| `ver_identidad` (o `admin`) | Sección **IDENTIDAD**: Menú por rol, Usuarios y roles, Sincronización BPM | `AppShell.tsx:165` (`puedeVerIdentidad`), Sidebar (`:342`), rutas (`:475`–`:480`) |
| `usar_finanzas` (o `admin`) | Sección **PERSONAL · SOLO LOCAL**: Finanzas, Gastos fijos | `AppShell.tsx:166` (`puedeVerPersonal`), Sidebar (`:368`), rutas (`:482`–`:491`) |

El hook que hace la comparación es `agents-ui/src/ui/useHasRole.ts` — recibe el `Usuario` (con `roles: string[]`, ya mezclando `realm_access` + todos los `resource_access` gracias a `KeycloakAuthAdapter.ts`) y una lista de roles aceptados, devuelve `true` si hay intersección.

**Dos capas de protección, no una:**
1. **Sidebar**: si `puedeVerX` es `false`, la sección entera no se renderiza (`{puedeVerAgentes && (...)}`) — ni el link existe en el DOM.
2. **Ruta**: cada `<Route>` de esas secciones está envuelta en un helper `protegido(permitido, elemento)` dentro de `AppShell.tsx`. Si el usuario entra por URL directa sin el rol, ve el componente `AccesoDenegado` (`agents-ui/src/ui/components/AccesoDenegado.tsx`) en vez de la página real.

## 4. Nombres exactos de los 5 roles

Todos en **snake_case** (no kebab-case como los roles viejos `ver-menu`/`autorizar`), porque así están escritos literalmente en el código ya implementado:

- `llm_basic`
- `llm_advanced`
- `ver_agentes`
- `ver_identidad`
- `usar_finanzas`

Ver `KC-04` para el detalle de por qué, y la nota sobre el *client role* `usar-finanzas` (con guion) que ya existe para otra cosa (el service account de `finanzas-agent`, no tiene relación con este `usar_finanzas` de realm).

## 5. Verificar que funcionó

- **Modelos**: loguéate, abre el chat, el selector de arriba a la derecha debería listar más de una opción si tienes `llm_basic`/`llm_advanced`. En la consola del navegador vas a ver `[modelo] catálogo cargado (...)` con la lista real. En la terminal del backend, cada mensaje enviado imprime `Header X-LLM-Model autorizado (model=...)` o, si lo rechaza, `Modelo pedido por el cliente fuera de catalogo`.
- **Sidebar**: con el rol asignado, la sección aparece en el Sidebar; sin él, ni aparece ahí ni se puede entrar por URL directa (ves "No tienes permiso para ver esta sección").

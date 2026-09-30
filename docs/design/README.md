# Lara · Guía de UI para `agents-ui`

Referencia visual y de diseño para construir Lara (carpeta `agents-ui`, React + Vite + Tailwind).
Las capturas están en `png/`. Si una captura y este texto no coinciden, **manda la captura**.

> Todos los datos de las pantallas son de ejemplo. Nada de esto es información real.

## Cómo usar esta guía con Copilot

- No la cargues completa en cada conversación. Pásale solo lo que necesita la tarea:
  `#docs/design/lara/README.md` + la captura de la pantalla que vas a construir.
- Construye **una pantalla por tarea**, en el orden de la tabla de pantallas.
- Los colores y medidas de la sección "Tokens" van en `tailwind` / CSS variables una sola vez; las pantallas solo los usan.

## Tokens

### Colores

| Token | Hex | Uso |
| --- | --- | --- |
| `bg` | `#111316` | Fondo de la app |
| `sidebar` | `#15181C` | Barra lateral |
| `surface` | `#1A1E23` | Tarjetas, composer, tablas |
| `surface-hover` | `#20252B` | Hover de botones y filas |
| `surface-active` | `#252B33` | Item activo, burbuja del usuario |
| `border` | `#2B3139` | Bordes |
| `divider` | `#22272E` | Separadores finos |
| `text` | `#E6E9ED` | Texto principal |
| `text-2` | `#C5CCD4` | Texto secundario en controles |
| `muted` | `#A7AFB9` | Descripciones |
| `faint` | `#8B94A0` | Notas y etiquetas de sección |
| `accent` | `#7CC4F2` | Azul cielo: botón principal, links, logo |
| `accent-ink` | `#0A1A26` | Texto sobre el azul cielo |
| `mint` | `#A8E6CF` | OK, arriba, permitida, confirmado |
| `butter` | `#F2E3A0` | A medias, solo lectura, dry-run |
| `pink` | `#F4B6C9` | Pendiente, bloqueada, huérfana |
| `lavender` | `#C9B8F2` | Roles elevados (autorizar), agente menu |
| `peach` | `#F7C8A0` | Gastos variables, picos en proyección |

Pastel sobre fondo oscuro para "pills": fondo tenue + texto pastel
(`#1E2A33`/azul, `#1F3029`/menta, `#2A2536`/lavanda, `#33242A`/rosa, `#332E1E`/mantequilla, `#33291F`/durazno).

**Regla:** el estado nunca se comunica solo con color. Siempre va con texto ("Arriba", "Pendiente", "bloqueada").

### Tipografía

- Texto: **IBM Plex Sans** 400/500/600.
- Datos técnicos (puertos, ids, SQL, tokens, montos en tablas): **IBM Plex Mono** 400/500.
- Tamaños: título de pantalla 26px/600 · subtítulo 14px muted · cuerpo del chat 15px/1.6 · tablas 13px · etiquetas de sección 11px mono con `letter-spacing: .08em`.

### Medidas

- Radios: botones 8–10px · tarjetas 12–14px · composer 16px · pills 999px.
- Espaciado: padding de pantalla 32px · gap entre bloques 24px · gap en grids 16px.
- Barra lateral: 272px fija. Contenido del chat: `max-width: 760px` centrado.
- Área táctil mínima 44px en la navegación. En menos de 980px la barra lateral se oculta y los grids pasan a una columna.

## Estructura de la app

```
App
├── Sidebar
│   ├── Logo + contraer
│   ├── Nuevo chat (botón principal) · Buscar chats · Estado del lab
│   ├── AGENTES: Agentes · Base de datos · Memoria vectorizada · Herramientas MCP
│   ├── IDENTIDAD: Menú por rol · Usuarios y roles · Sincronización BPM
│   ├── PERSONAL · SOLO LOCAL: Finanzas · Gastos fijos
│   ├── RECIENTES: lista de chats
│   └── Usuario (username, rol, entorno) · Configuración · Cerrar sesión
└── Main: una vista a la vez (ruta por vista)
```

El item activo usa `aria-current="page"`. Cerrar sesión llama a `logout` de Keycloak.

## Pantallas

| # | Captura | Vista | Parte del lab | Fuente de datos |
| --- | --- | --- | --- | --- |
| 01 | `png/01-login.png` | Login | C.1 | Keycloak (redirect PKCE) |
| 02 | `png/02-estado-lab.png` | Estado del lab | todas | Health checks de puertos + `docs/plans/estado-lab.md` |
| 03 | `png/03-nuevo-chat.png` | Nuevo chat | C | — |
| 04 | `png/04-chat.png` | Chat | C, B.4 | ADK API server `:8010` (SSE) |
| 05 | `png/05-agentes.png` | Agentes | B | `/.well-known/agent-card.json` de cada agente |
| 06 | `png/06-base-de-datos.png` | Base de datos | B.5 | SQLite de sesiones, solo lectura |
| 07 | `png/07-memoria.png` | Memoria vectorizada | Módulo 7 | Memory service / RAG |
| 08 | `png/08-herramientas.png` | Herramientas MCP | B.6 | Lista de tools y permisos |
| 09 | `png/09-menu-por-rol.png` | Menú por rol | kc-front | kc-demo `GET /api/menu` |
| 10 | `png/10-usuarios-roles.png` | Usuarios y roles | Keycloak | Admin REST API, solo lectura |
| 11 | `png/11-sincronizacion-bpm.png` | Sincronización BPM | bpm-sync | Resultado del dry-run |
| 12 | `png/12-finanzas.png` | Finanzas | Parte D (a futuro) | BD local de finanzas |
| 13 | `png/13-gastos-fijos.png` | Gastos fijos | Parte D (a futuro) | BD local de finanzas |

### 01 · Login
![Login](png/01-login.png)
- Izquierda: badge `LOCAL`, título "Inicia sesión", un solo botón **Continuar con Keycloak** (sin campos de usuario/contraseña: el formulario lo muestra Keycloak).
- Debajo: realm, client y flujo en mono. Ayuda si Keycloak no responde.
- Derecha: panel de marca con las 4 áreas (Agentes, Identidad, Memoria, Finanzas).

### 02 · Estado del lab
![Estado del lab](png/02-estado-lab.png)
- Grid de 4 columnas con cada servicio: nombre, puerto, punto de estado + leyenda con texto.
- Abajo: "Avance por parte" (barras) y "Sigue en el checklist" (4 siguientes pendientes).

### 03 · Nuevo chat
![Nuevo chat](png/03-nuevo-chat.png)
- Saludo con el nombre del usuario, composer grande y 4 sugerencias con la etiqueta del agente o fuente que responde.

### 04 · Chat
![Chat](png/04-chat.png)
- Encabezado: título de la conversación + agente y modelo.
- Mensajes del usuario a la derecha; respuestas con avatar a la izquierda.
- **Eventos A2A** como separador centrado en mono ("orquestador → aclaraciones · A2A · transfiere el control").
- Pasos del flujo determinista como lista con check.
- Composer: adjuntar, agente activo, memoria activa, enviar. Streaming: el texto aparece mientras llega.
- La salida del agente se pinta como texto. **Nunca** `dangerouslySetInnerHTML`.

### 05 · Agentes
![Agentes](png/05-agentes.png)
- Una tarjeta por agente: estado, descripción, lenguaje/puerto y una pill con su forma de colaborar (raíz, transfiere el control, pregunta y responde). Link a su agent card.

### 06 · Base de datos
![Base de datos](png/06-base-de-datos.png)
- Pills: motor y archivo, **Solo lectura**. Tabs por tabla. Consulta SQL visible y resultado en tabla mono.
- Solo `SELECT`. La conexión se abre en modo lectura.

### 07 · Memoria vectorizada
![Memoria vectorizada](png/07-memoria.png)
- Buscador, filtros por colección y resultados con fuente, fragmento y puntaje de similitud (barra + número).

### 08 · Herramientas MCP
![Herramientas MCP](png/08-herramientas.png)
- Tabla: herramienta, origen, permiso (permitida / solo lectura / bloqueada).

### 09 · Menú por rol
![Menú por rol](png/09-menu-por-rol.png)
- Una tarjeta por usuario de prueba con sus roles y las opciones que ve. La acción "Aprobar" solo para el rol `autorizar`.
- Nota: la acción también se valida en el backend.

### 10 · Usuarios y roles
![Usuarios y roles](png/10-usuarios-roles.png)
- Tabla de usuarios, grupo y roles del client. Inspector de token con los claims decodificados.
- El token solo se decodifica en pantalla; nunca se guarda ni se manda a otro lado.

### 11 · Sincronización BPM
![Sincronización BPM](png/11-sincronizacion-bpm.png)
- Pill **Dry-run** y botón para ejecutarlo. Contadores: crear, actualizar, sin cambios, huérfanas.
- Tabla con la acción por usuario. Las huérfanas no se borran solas.

### 12 · Finanzas (a futuro)
![Finanzas](png/12-finanzas.png)
- Selector de mes y botón **Importar xlsx o Takeout**.
- KPIs: gasto del mes, fijos, variables. Barras por categoría. Últimos movimientos con su origen (xlsx / Google Wallet).

### 13 · Gastos fijos (a futuro)
![Gastos fijos](png/13-gastos-fijos.png)
- Tabla de fijos detectados: confirmados y por confirmar (Confirmar / Descartar).
- Proyección de 6 meses en barras; el pico va en durazno con su explicación en texto.
- La proyección se calcula en código, no con el LLM.

## Reglas para implementar

- Arquitectura hexagonal ligera: `AuthPort`, `AgentePort` y un puerto por fuente de datos de cada vista.
- Tokens solo en memoria. Nada en `localStorage`.
- Vistas de administración (BD, usuarios, BPM, herramientas) **solo lectura** desde Lara.
- Finanzas: datos en `agents/data/` (ignorado por Git); al agente solo le llegan resúmenes.
- Botones reales (`<button>`, `<a>`), `aria-label` en botones de solo ícono, contraste AA.

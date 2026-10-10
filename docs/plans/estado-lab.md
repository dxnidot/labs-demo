# Estado del lab

Última actualización: 2026-10-10

Leyenda: ✅ Confirmado · 🔎 Inferido (falta validar) · ⏳ Pendiente

## Contexto para continuar (2026-10-10)

Resumen para retomar el trabajo en otra sesión o en otro equipo. No contiene secretos ni datos reales: solo nombres de variables y datos ficticios.

### Qué está hecho y publicado

**Ramas** (origen: `https://github.com/dxnidot/labs-demo`). Desde esta sesión no se fusionó ninguna en otra y no se abrió ningún PR.

| Rama | Último commit | Qué contiene |
| --- | --- | --- |
| `feat/new-front` | `cc348fe` fix(keycloak): variables del realm sin prefijo KC_ | ADR-0006 y ADR-0007 aplicados: Keycloak como código, renombres de identificadores, lista de campos permitidos hacia el modelo en el orquestador |
| `feat/lara-ui-polish` | ver `git log -1` (el último trabajo funcional es `c281886`; `17b71a0` es el último de docs de UI-09) | Sale de `feat/new-front` (la incluye) y agrega el pulido visual de Lara (UI-09, fases A, B y C1) |

**Commits de `feat/lara-ui-polish`**, del más antiguo al más reciente:

| Commit | Qué hace |
| --- | --- |
| `0334f0d` | `EnviarMensaje.test.ts` a UTF-8 |
| `8a203dc` | Quita el marco de 32/24/32 px del shell (`PageLayout` libre) |
| `849958f` | Fuentes locales con Fontsource, `data-font` y diálogo Apariencia |
| `c82405a` | Tokens semánticos, escala tipográfica y `Pill` con 4 tonos |
| `7004573` | WIP del tema claro y oscuro (después aprobado) |
| `611c621` | Aviso fijo de ADR-0007 junto al campo del chat |
| `1050c47` | Docs: UI-09 en curso, paleta clara y reglas de `localStorage` |
| `53edffd` | Accesibilidad: foco, teclado, táctil, skip link, título por vista, favicon y movimiento reducido |
| `0716d42` | Adaptadores mock y composition root con `VITE_USE_MOCKS` |
| `d0ebd85` | Estados comunes de carga, vacío y error con reintento |
| `a6673b5` | Corrige la carrera de foco al contraer la barra lateral (test intermitente) |
| `c025c1a` | "Monto" visible en Últimos movimientos y chat vacío arriba a 320 px |
| `c281886` | Finanzas según los mockups 12 y 14 (Inversiones, periodo, banner, tiles, calendario) |
| `17b71a0` | Docs: UI-09 con la paleta aprobada |

Los commits hasta `53edffd` salen con el autor `Claude`; desde `0716d42`, con `dxnidot` (configuración local del repo, la global no se tocó).

**Estado de UI-09** (detalle y tareas marcadas en `docs/backlog/UI-09-pulido-visual-lara.md`): fases A y B hechas, y de la fase C el punto C1 (mocks, estados comunes y Finanzas). Al cerrar, `npm run build` y `npm test` pasan en `apps/lara-web` (392 pruebas).

### Qué está pendiente

- **UI-09, fase C (resto):** pulir contra su PNG las vistas 05–11 y 13 (Agentes, Base de datos ampliada, Memoria, Herramientas, Menú por rol, Usuarios y roles, Sincronización BPM, Gastos fijos) con sus puertos y mocks, y el chat con eventos A2A, pasos y adjuntar. Fase D: motion solo con CSS.
- **Fuentes Lato y NTR:** la guía las citaba; no están instaladas porque requieren autorizar sus paquetes `@fontsource`.
- **Keycloak (KC-03):** falta probar el import en Docker; no se pudo en el entorno donde se escribió. KC-01 (subir a 26.7.5) sigue pendiente.
- **Ajustes de ADR-0006 que quedan:** el client `finanzas-agent` (no sigue la regla de nombrarlo como el servicio) y los roles de realm en `snake_case` (`llm_basic`, `llm_advanced`, `ver_agentes`, `ver_identidad`).
- **ADR-0006 y ADR-0007 están en estado "Propuesta":** falta aceptarlos o ajustarlos.
- **ADR-0007:** revisar los términos de retención de cada proveedor y plan (retención, entrenamiento, ubicación) y registrar el resultado con fecha.
- **Backends que alimentan las vistas:** FIN-17 (totales mensuales, serie de 6 meses, calendario con `ultimos4` y `diasRestantes`; hoy la UI solo resta fechas y no calcula totales), FIN-03 (gastos fijos), FIN-04 (inversiones), AG-02 a AG-06, el servicio de memoria y `bpm-sync`.
- **Capturas:** las de `.capturas/` se generaron en el entorno remoto y no están en el repo (carpeta ignorada). El arnés que las produjo (Keycloak y backend simulados con Playwright) vivía fuera del repo; QA-01 es la historia para formalizarlo.

### Decisiones y sus razones

| Decisión | Razón |
| --- | --- |
| **ADR-0006:** convención de nombres; el realm `lab` se recrea con `kc-menu` y `lara-web` como clients, rol de realm `ver-finanzas` y volumen `keycloak-pgdata` | Renombrar a ciegas rompe código, tests, variables y datos; se fijó una regla para lo nuevo y se corrigió la deuda de una vez al recrear el realm con una base nueva. Quedan nombres viejos acotados en el ADR |
| **ADR-0007:** documentar y reducir lo que sale hacia el proveedor del modelo (opción B) | ADR-0005 decía que el modelo solo recibía agregados y el código mostraba otra cosa (mensaje, historial y resultados de herramientas). Se documentó el flujo real, el orquestador ahora devuelve solo campos permitidos por herramienta (nunca `ultimos4`; tras escribir, solo estado e `id`) y Lara muestra un aviso fijo: "Lo que escribas aquí se envía al proveedor del modelo…". Sin botón de cerrar y sin almacenamiento, para que sea siempre visible |
| **`localStorage` solo con `lara.fuente` y `lara.tema`** (valores `ibm-plex-sans` / `ibm-plex-mono` y `sistema` / `claro` / `oscuro`; por defecto IBM Plex Sans y `sistema`) | Son preferencias visuales no sensibles que deben sobrevivir a la recarga sin servidor. Se leen y escriben con `try/catch` y valor por defecto; los tokens siguen solo en memoria y nada más va a `localStorage`, tampoco los mocks. Reglas en `.github/copilot-instructions.md`, `PRODUCT.md` y el README de diseño |
| **Tema claro con `light-dark()` y `color-scheme`** | Cada token se define una sola vez, sin duplicar bloques para `prefers-color-scheme` y `data-theme`. El oscuro conserva los valores de los PNG; el claro sale de la misma paleta con los papeles invertidos. Soporte: Chrome y Edge 123, Firefox 120, Safari 17.5 (MDN). Un script inline aplica tema y fuente antes del primer render (sin parpadeo). Contraste calculado y vigilado por pruebas: texto 4.5:1 y controles y estados 3:1 en ambos temas (excepción: `chart-5`, con etiqueta y valor en texto); `ok` y `danger` también se distinguen por forma |
| **Fuentes con Fontsource, IBM Plex Sans por defecto** | Coincide con los PNG y con `index.css`; sin peticiones a Google en ejecución (repo y uso locales). Licencia OFL-1.1 |
| **Keycloak como código (`infra/keycloak/import/lab-realm.json`) aplicado recreando el volumen** | `--import-realm` omite el import si el realm ya existe, así que un cambio en el JSON no llega a un realm ya importado. Para aplicar los renombres hubo que arrancar con una base vacía: el volumen nuevo se llama `keycloak-pgdata` y el anterior (`kc-pgdata`) queda sin usar, sin borrarlo. Los secrets y las contraseñas son marcadores `${VAR}` que Compose exige (prefijo `LAB_`, no `KC_`, porque Keycloak reserva `KC_*`). **Nunca `docker compose down -v`** en Keycloak |
| **Adaptadores mock con un único composition root** (`VITE_USE_MOCKS`) | Permite desarrollar y mostrar Lara sin Keycloak ni backend, con datos ficticios en memoria (repo público). Sin la variable, se usan los servicios reales como siempre |
| **Finanzas del mockup con tres desvíos deliberados** | La tarjeta inactiva se atenúa con tokens y no con `opacity` (contraste AA); el calendario añade flechas de mes; Resumen muestra un aviso en lugar de KPIs porque la UI no calcula totales (las cifras las calcula el código del servicio) |
| **No tocar el flujo de autenticación de Keycloak** al pulir la UI | El renombre de identificadores se hizo aparte en `feat/new-front`; `feat/lara-ui-polish` solo incorporó esos cambios |

### Qué probar en tu PC

1. **Traer y construir** (PowerShell, `D:\dev\labs`):
   ```powershell
   git fetch origin
   git switch feat/lara-ui-polish
   cd apps\lara-web
   npm ci
   npm test
   npm run build
   ```
2. **Modo mock** (sin Docker):
   ```powershell
   $env:VITE_USE_MOCKS = "true"; npm run dev
   ```
   Abre `http://localhost:5173`. Comprueba: pill "MOCK"; Apariencia (tema Sistema, Claro y Oscuro, y las dos fuentes); Finanzas con sus 5 pestañas, el periodo con flechas, "Actualizado hace…", el calendario con flechas y RePág/AvPág, y `/finanzas/trading-usa` redirigiendo a Inversiones; el aviso de ADR-0007 junto al campo de chat y del asistente; el skip link con Tab; y "reducir movimiento" activado en el sistema.
3. **`localStorage`:** en las herramientas del navegador debe haber solo `lara.fuente` y `lara.tema`; en la pestaña de red, ninguna petición a Google Fonts.
4. **Keycloak recreado** (necesita Docker). En `infra\keycloak`, copia `.env.example` a `.env` y define tus propios valores para `LAB_MENU_CLIENT_SECRET`, `FINANZAS_AGENT_CLIENT_SECRET`, `LAB_ANA_PASSWORD`, `LAB_BETO_PASSWORD` y `LAB_ADMIN_PASSWORD` (Compose se detiene si falta alguna), y luego `docker compose up -d`. Comprueba en `http://localhost:8080/admin` (realm `lab`, no `master`) que existen los clients `kc-menu`, `lara-web` y `finanzas-agent`, y los roles de realm. Si ya tenías un realm `lab` importado, el JSON no lo sobrescribe: usa un volumen nuevo o borra el realm en la consola (esto elimina sus usuarios y datos).
5. **Modo real:** en `agents\orquestador\.env` deben coincidir `KEYCLOAK_AUDIENCE` (ahora `lara-web`) y `FINANZAS_AGENT_CLIENT_SECRET` (el mismo valor que en `infra\keycloak\.env`). Levanta kc-menu, kc-finanzas, el orquestador y `npm run dev` sin la variable mock. Entra a Lara con `ana` (ve Finanzas) y con `beto` o `admin` (ven también Agentes e Identidad), y comprueba el login, el menú por rol y el chat.
6. **Historial:** abre el historial de un chat real y confirma que lo que ves coincide con lo que esperas que se haya enviado al proveedor (ver siguientes pasos).

### Siguientes pasos

1. **Fase C de UI-09:** vista por vista (orden sugerido: Agentes y Herramientas, Base de datos, Menú por rol y Usuarios, Memoria, Sincronización BPM, Gastos fijos), cada una con su puerto y mock y comparada contra su PNG; después el chat con A2A, pasos y adjuntar. Luego la fase D (motion en CSS).
2. **Probar y cerrar Keycloak como código:** validar el import en Docker (KC-03), los logins y el audience de `lara-web`, y decidir si se aceptan ADR-0006 y ADR-0007.
3. **Backends:** FIN-17 primero (totales, serie, `ultimos4` y `diasRestantes`: desbloquea KPIs, gráfica y "en N días" reales), luego FIN-03, FIN-04, la persistencia de sesión (AG-05) y los agentes AG-02 a AG-04. Cada vista pasa de mock a real cambiando solo el adaptador del composition root.
4. **Auditoría de privacidad del historial:** el historial de conversaciones vive en el servidor ADK y se reenvía al proveedor del modelo en cada turno. Revisar qué se guarda y por cuánto tiempo (sesiones en `agents/data/` o en el servidor ADK), qué contienen los mensajes y las vistas previas (comercio, alias, últimos cuatro dígitos), si conviene limitar o purgar el historial, y registrar el resultado junto con la revisión de retención de los proveedores de ADR-0007. Hasta entonces, el aviso de Lara es la mitigación visible.

## Reorganización del monorepo (2026-10-10)

Equivalencia de nombres. Los docs históricos (`docs/backlog`, `docs/decisions`, `docs/bugs`) conservan los nombres de antes.

| Antes | Ahora |
| --- | --- |
| `keycloak/` | `infra/keycloak/` |
| `finanzas/` | `services/kc-finanzas/` |
| `kc-demo/` | `services/kc-menu/` |
| `agents-ui/` | `apps/lara-web/` |

Sin cambios: puertos, nombres de BD, rutas HTTP y paquetes Java. Clients de Keycloak (2026-10-10, realm recreado desde `infra/keycloak/import/lab-realm.json`): `chat-api` → `kc-menu`, `agents-ui` → `lara-web`, `chat-front` eliminado, `finanzas-agent` sin cambios; rol de realm `usar_finanzas` → `ver-finanzas`; volumen `kc-pgdata` → `keycloak-pgdata`; variable `KC_CHAT_API_SECRET` → `LAB_MENU_CLIENT_SECRET`. Los compose fijan `name: keycloak` y `name: finanzas` para conservar los volúmenes de datos.

## Repo y documentación

- [x] ✅ Monorepo `labs-demo` con historia de `kc-demo` conservada
- [x] ✅ Contraseñas de Keycloak en `infra/keycloak/.env` (ignorado) + `.env.example`
- [x] ✅ `.gitignore` con reglas `.env`, `!.env.example` y `docs/private/`
- [x] ✅ Estructura `docs/` (backlog, bugs, decisions, plans, archive, private)
- [x] ✅ DOC-02 · Guía de UI de Lara: README y 13 capturas
- [ ] ⏳ Auditoría de secretos completa (`git ls-files` filtrado)
- [ ] 🔄 DOC-01 · ADR de versiones en `docs/decisions/0001-versiones.md`
- [ ] 🔄 DOC-01 · Plantillas: backlog, bug y ADR

## keycloak (puerto 8080)

- [x] ✅ Keycloak + PostgreSQL con Docker Compose, puerto atado a 127.0.0.1
- [x] ✅ Realm `lab`, usuarios `ana` / `beto`, client `kc-menu` (antes `chat-api`) con roles
- [x] ✅ Authorization Services (RPT)
- [ ] ⏳ KC-01 · Subir Keycloak a 26.7.5 (parche)
- [x] ✅ KC-02 · Client público `lara-web` (antes `agents-ui`)
- [ ] 🔄 KC-03 · En curso: realm `lab` en `infra/keycloak/import/lab-realm.json`; falta probar el import — Track de identidad: solo para pruebas

## kc-menu, antes kc-demo (Spring Boot, puerto 8081)

- [x] ✅ Valida JWT y roles de `resource_access.kc-menu.roles`
- [x] ✅ `/api/menu` filtra opciones y acciones por rol
- [x] ✅ Java 21 fijado en `pom.xml`
- [x] ✅ API-01 · Pruebas unitarias de `MenuService` (JUnit 5 + Mockito, AAA)

## kc-front (Angular, ya no está en el monorepo)

- [x] ✅ Retirado del monorepo: el front actual es `apps/lara-web` (React + Vite + Tailwind 4, hexagonal)
- [ ] ⏳ FE-02 · Angular 22.2.1 con `ng update` (TypeScript se queda en 6.0) — sin código en el repo; el backlog decide si se cancela

## bpm-sync

- [ ] ⏳ BPM-01 · Diseño listo; implementación sin iniciar — Track de identidad: solo para pruebas

## .github (Copilot)

- [x] ✅ CP-01 · Instrucciones, agentes y skills por lenguaje
- [ ] ⏳ CP-02 · Probar `test-engineer`, `keycloak-security` y la skill `keycloak-lab`
- [x] ✅ CP-03 · Skill de dominio `finanzas-dominio` para Copilot

## agents (ADK)

- [x] ✅ AG-00 · Entorno: venv, `google-adk[a2a]`, `litellm>=1.84`
- [x] ✅ AG-01 · Orquestador Python en `adk web` (8000)
- [ ] ⏳ AG-02 · Cálculos financieros Java sin LLM (8002)
- [ ] ⏳ AG-03 · Traductor TypeScript A2A (8003)
- [ ] ⏳ AG-04 · Delegación A2A a cálculos financieros y traductor
- [ ] ⏳ AG-05 · Sesión persistente en SQLite
- [ ] ⏳ AG-06 · MCP filesystem de solo lectura (opcional)
- [x] ❌ AG-08 · Cancelada: fusionada en FIN-14

## lara-web (antes agents-ui) / Lara (React, puerto 5173)

- [x] ✅ UI-01 · API server de ADK (8010)
- [x] ✅ UI-02 · Chat con login de Keycloak y streaming — login Keycloak, run_sse, Enter, razonamiento oculto y Markdown seguro
- [x] ✅ UI-03 · Design system de Lara — tokens Tailwind v4 y componentes base
- [ ] 🔄 UI-04 · En curso: shell e historial; Recientes corregido; demás vistas pendientes
- [ ] ⏳ UI-06 · Eliminar y renombrar chats en Recientes (Media; depende de UI-04)
- [ ] 🔄 UI-07 · En curso: todas las vistas 01–14, login propio e íconos
- [ ] 🔄 UI-08 · En curso: responsive y layout de página único
- [ ] 🔄 UI-09 · En curso: pulido visual de Lara (fases A y B hechas, con tema claro y oscuro; mocks, estados comunes y Finanzas listos; faltan el resto de las vistas con datos de relleno y el motion)
- [ ] ⏳ QA-01 · Capturas automáticas con Playwright para ui-reviewer (Baja; depende de UI-08)
- [ ] 🔄 FE-01 · En curso: menú por rol implementado en Lara; kc-front ya no está en el monorepo, falta cerrar la historia en el backlog — Track de identidad: solo para pruebas

## Finanzas personales

- [ ] ⏳ FIN-01 · D.1: importador xlsx/csv (Media)
- [ ] ⏳ FIN-02 · D.2: importador Takeout (validar formato real primero)
- [ ] ⏳ FIN-03 · D.3: detección de fijos y proyección (Media)
- [ ] ⏳ FIN-06 · Registro de ingresos (sueldo) y porcentaje comprometido en gastos fijos
- [ ] ⏳ FIN-07 · Recomendación educativa: pago total vs mínimo, intereses y fechas
- [x] ✅ FIN-09 · Hecho: Mis tarjetas y Próximos pagos (solo lectura)
- [x] ✅ FIN-10 · Hecho: microservicio de tarjetas y calendario financiero
- [x] ✅ FIN-11 · Hecho: movimientos de gastos e ingresos
- [x] ✅ FIN-12 · Hecho: pestaña Finanzas en Lara
- [x] ✅ FIN-13 · Hecho: autenticación del agente hacia finanzas
- [x] ✅ FIN-14 · Hecho: agente ADK de finanzas
- [x] ✅ FIN-15 · Hecho: chat de Finanzas e importación CSV (depende de FIN-14, FIN-12)
- [ ] ⏳ FIN-17 · Totales mensuales, serie de 6 meses y calendario con ultimos4 y diasRestantes (Media)

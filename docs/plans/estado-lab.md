# Estado del lab

Última actualización: 2026-09-30

Leyenda: ✅ Confirmado · 🔎 Inferido (falta validar) · ⏳ Pendiente

## Repo y documentación

- [x] ✅ Monorepo `labs-demo` con historia de `kc-demo` conservada
- [x] ✅ Contraseñas de Keycloak en `keycloak/.env` (ignorado) + `.env.example`
- [x] ✅ `.gitignore` con reglas `.env`, `!.env.example` y `docs/private/`
- [x] ✅ Estructura `docs/` (backlog, bugs, decisions, plans, archive, private)
- [x] ✅ DOC-02 · Guía de UI de Lara: README y 13 capturas
- [ ] ⏳ Auditoría de secretos completa (`git ls-files` filtrado)
- [ ] 🔄 DOC-01 · ADR de versiones en `docs/decisions/0001-versiones.md`
- [ ] 🔄 DOC-01 · Plantillas: backlog, bug y ADR

## keycloak (puerto 8080)

- [x] ✅ Keycloak + PostgreSQL con Docker Compose, puerto atado a 127.0.0.1
- [x] ✅ Realm `lab`, usuarios `ana` / `beto`, client `chat-api` con roles
- [x] ✅ Authorization Services (RPT)
- [ ] ⏳ KC-01 · Subir Keycloak a 26.7.5 (parche)
- [x] ✅ KC-02 · Client público `agents-ui`
- [ ] ⏳ KC-03 · Realm como código (export/import) — Track de identidad: solo para pruebas

## kc-demo (Spring Boot, puerto 8081)

- [x] ✅ Valida JWT y roles de `resource_access.chat-api.roles`
- [x] ✅ `/api/menu` filtra opciones y acciones por rol
- [x] ✅ Java 21 fijado en `pom.xml`
- [x] ✅ API-01 · Pruebas unitarias de `MenuService` (JUnit 5 + Mockito, AAA)

## kc-front (Angular, puerto 4200)

- [x] ✅ Angular hexagonal con Keycloak PKCE y Tailwind, en GitHub
- [ ] ⏳ FE-02 · Angular 22.2.1 con `ng update` (TypeScript se queda en 6.0)

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
- [ ] ⏳ AG-08 · Subagente inversiones en Python con tools conectadas a finanzas (Media; depende de FIN-10 y FIN-04)

## agents-ui / Lara (React, puerto 5173)

- [x] ✅ UI-01 · API server de ADK (8010)
- [x] ✅ UI-02 · Chat con login de Keycloak y streaming — login Keycloak, run_sse, Enter, razonamiento oculto y Markdown seguro
- [x] ✅ UI-03 · Design system de Lara — tokens Tailwind v4 y componentes base
- [ ] 🔄 UI-04 · En curso: shell e historial; Recientes corregido; demás vistas pendientes
- [ ] ⏳ UI-06 · Eliminar y renombrar chats en Recientes (Media; depende de UI-04)
- [ ] 🔄 FE-01 · En curso: menú por rol implementado en Lara; retiro de kc-front pendiente — Track de identidad: solo para pruebas

## Finanzas personales

- [ ] ⏳ FIN-01 · D.1: importador xlsx/csv (Media)
- [ ] ⏳ FIN-02 · D.2: importador Takeout (validar formato real primero)
- [ ] ⏳ FIN-03 · D.3: detección de fijos y proyección (Media)
- [ ] ⏳ FIN-06 · Registro de ingresos (sueldo) y porcentaje comprometido en gastos fijos
- [ ] ⏳ FIN-07 · Recomendación educativa: pago total vs mínimo, intereses y fechas
- [x] ✅ FIN-09 · Hecho: Mis tarjetas y Próximos pagos (solo lectura)
- [x] ✅ FIN-10 · Hecho: microservicio de tarjetas y calendario financiero

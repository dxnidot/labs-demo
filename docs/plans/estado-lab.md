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
- [ ] ⏳ KC-03 · Realm como código (export/import)

## kc-demo (Spring Boot, puerto 8081)

- [x] ✅ Valida JWT y roles de `resource_access.chat-api.roles`
- [x] ✅ `/api/menu` filtra opciones y acciones por rol
- [x] ✅ Java 21 fijado en `pom.xml`
- [ ] ⏳ API-01 · Pruebas de `MenuService` con el agente `test-engineer`

## kc-front (Angular, puerto 4200)

- [x] ✅ Angular hexagonal con Keycloak PKCE y Tailwind, en GitHub
- [ ] ⏳ FE-02 · Angular 22.2.1 con `ng update` (TypeScript se queda en 6.0)

## bpm-sync

- [ ] ⏳ BPM-01 · Diseño listo; implementación sin iniciar

## .github (Copilot)

- [x] ✅ CP-01 · Instrucciones, agentes y skills por lenguaje
- [ ] ⏳ CP-02 · Probar `test-engineer`, `keycloak-security` y la skill `keycloak-lab`

## agents (ADK)

- [x] ✅ AG-00 · Entorno: venv, `google-adk[a2a]`, `litellm>=1.84`
- [x] ✅ AG-01 · Orquestador Python en `adk web` (8000)
- [ ] ⏳ AG-02 · Agente Java con agent card (8002)
- [ ] ⏳ AG-03 · Agente TypeScript con agent card (8003)
- [ ] ⏳ AG-04 · Delegación A2A
- [ ] ⏳ AG-05 · Sesión persistente en SQLite
- [ ] ⏳ AG-06 · MCP filesystem de solo lectura (opcional)

## agents-ui / Lara (React, puerto 5173)

- [x] ✅ UI-01 · API server de ADK (8010)
- [x] ✅ UI-02 · Chat con login de Keycloak y streaming — login Keycloak, run_sse, Enter, razonamiento oculto y Markdown seguro
- [x] ✅ UI-03 · Design system de Lara — tokens Tailwind v4 y componentes base
- [ ] 🔄 UI-04 · C.5: shell del chat e historial implementados; demás vistas pendientes

## Personal (a futuro)

- [ ] ⏳ FIN-01 · D.1: importador xlsx/csv
- [ ] ⏳ FIN-02 · D.2: importador Takeout (validar formato real primero)
- [ ] ⏳ FIN-03 · D.3: detección de fijos y proyección

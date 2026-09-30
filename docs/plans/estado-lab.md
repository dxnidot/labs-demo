# Estado del lab

Última actualización: 2026-09-30

Leyenda: ✅ Confirmado · 🔎 Inferido (falta validar) · ⏳ Pendiente

## Repo y documentación

- [x] ✅ Monorepo `labs-demo` con historia de `kc-demo` conservada
- [x] ✅ Contraseñas de Keycloak en `keycloak/.env` (ignorado) + `.env.example`
- [x] ✅ `.gitignore` con reglas `.env`, `!.env.example` y `docs/private/`
- [x] ✅ Estructura `docs/` (backlog, bugs, decisions, plans, archive, private)
- [ ] ⏳ Auditoría de secretos completa (`git ls-files` filtrado)
- [ ] ⏳ ADR de versiones en `docs/decisions/0001-versiones.md`
- [ ] ⏳ Plantillas: backlog, bug y ADR

## keycloak (puerto 8080)

- [x] ✅ Keycloak + PostgreSQL con Docker Compose, puerto atado a 127.0.0.1
- [x] ✅ Realm `lab`, usuarios `ana` / `beto`, client `chat-api` con roles
- [x] ✅ Authorization Services (RPT)
- [ ] ⏳ Subir Keycloak a 26.7.5 (parche)
- [ ] ⏳ Client público `agents-ui`
- [ ] ⏳ Realm como código (export/import)

## kc-demo (Spring Boot, puerto 8081)

- [x] ✅ Valida JWT y roles de `resource_access.chat-api.roles`
- [x] ✅ `/api/menu` filtra opciones y acciones por rol
- [x] ✅ Java 21 fijado en `pom.xml`
- [ ] ⏳ Pruebas de `MenuService` con el agente `test-engineer`

## kc-front (Angular, puerto 4200)

- [x] ✅ Angular hexagonal con Keycloak PKCE y Tailwind, en GitHub
- [ ] ⏳ Angular 22.2.1 con `ng update` (TypeScript se queda en 6.0)

## bpm-sync

- [ ] ⏳ Diseño listo; implementación sin iniciar

## .github (Copilot)

- [ ] ⏳ Instrucciones, agentes y skills por lenguaje
- [ ] ⏳ Probar `test-engineer`, `keycloak-security` y la skill `keycloak-lab`

## agents (ADK)

- [ ] ⏳ Entorno: venv, `google-adk[a2a]`, `litellm>=1.84`
- [ ] ⏳ Orquestador Python en `adk web` (8000)
- [ ] ⏳ Agente Java con agent card (8002)
- [ ] ⏳ Agente TypeScript con agent card (8003)
- [ ] ⏳ Delegación A2A
- [ ] ⏳ Sesión persistente en SQLite
- [ ] ⏳ MCP filesystem de solo lectura (opcional)

## agents-ui (React, puerto 5173)

- [ ] ⏳ API server de ADK (8010)
- [ ] ⏳ Chat con login de Keycloak y streaming

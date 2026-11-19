# labs-demo

Laboratorio personal que corre en local: Keycloak, microservicios Spring Boot, un orquestador de agentes (Google ADK) y Lara, una interfaz web de chat y finanzas personales. El repo es público: todos los datos son ficticios y no hay secretos.

## Estructura

| Carpeta | Qué es | Puerto |
| --- | --- | --- |
| `infra/keycloak/` | Keycloak 26 + PostgreSQL (Docker Compose), realm `lab` | 8080 |
| `services/kc-menu/` | API Spring Boot 4 (Java 21): valida el JWT y arma el menú según los roles | 8081 |
| `services/kc-finanzas/` | API Spring Boot 4 (Java 21) de finanzas personales, con su PostgreSQL (Docker Compose) | 8083 (BD en 5433) |
| `agents/orquestador/` | Orquestador de agentes (Python, Google ADK) con API protegida por token de Keycloak | 8010 |
| `apps/lara-web/` | Lara: React + Vite + Tailwind, con login de Keycloak | 5173 |
| `docs/` | Snapshot del estado, guía visual de Lara y archivo histórico | — |

## Levantar (Windows, PowerShell)

Cada paso parte de la raíz del repo.

1. **Keycloak:** `cd infra/keycloak`, copia `.env.example` a `.env` y pon tus propios secrets y contraseñas. Luego `docker compose up -d` y entra a http://localhost:8080/admin. El realm `lab` se importa solo. Detalle en [`infra/keycloak/README.md`](infra/keycloak/README.md).
2. **kc-menu:** `cd services/kc-menu` y `.\mvnw.cmd spring-boot:run`.
3. **kc-finanzas:** sigue [`services/kc-finanzas/README.md`](services/kc-finanzas/README.md).
4. **Orquestador:** copia `agents/orquestador/.env.example` a `agents/orquestador/.env` y completa tus claves. Luego `cd agents` y, con el entorno virtual activo, `python -m uvicorn --factory orquestador.api:create_app --host 127.0.0.1 --port 8010`.
5. **Lara:** `cd apps/lara-web`, `npm install` y `npm run dev`. Con `VITE_USE_MOCKS=true` en `.env.local` abre sin Keycloak ni backend, con datos ficticios (se ve un indicador MOCK).

## Más información

- Estado actual del proyecto: [`docs/`](docs/README.md).
- Guía visual de Lara: [`docs/design/lara/README.md`](docs/design/lara/README.md).

Solo para uso local. No uses esta configuración en producción.

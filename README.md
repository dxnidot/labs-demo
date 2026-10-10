# labs-demo

Laboratorio personal de Keycloak + Spring Boot: roles por grupo, Authorization Services (RPT) y un servicio de perfiles que arma el menu segun los roles del token.

## Estructura

- `infra/keycloak/`: Keycloak 26 + PostgreSQL con Docker Compose.
- `services/kc-menu/`: microservicio Spring Boot 4 (Java 21) que valida JWT de Keycloak y expone `/api/menu`.

## Levantar

1. `cd infra/keycloak`, copia `.env.example` a `.env` y pon tus propios secrets y contrasenas (el realm `lab` se importa de `import/lab-realm.json`).
2. `docker compose up -d` y entra a http://localhost:8080/admin.
3. `cd ../../services/kc-menu` y `.\mvnw.cmd spring-boot:run` (puerto 8081).

Solo para uso local. No usar esta configuracion en produccion.

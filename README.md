# labs-demo

Laboratorio personal de Keycloak + Spring Boot: roles por grupo, Authorization Services (RPT) y un servicio de perfiles que arma el menu segun los roles del token.

## Estructura

- `keycloak/`: Keycloak 26 + PostgreSQL con Docker Compose.
- `kc-demo/`: microservicio Spring Boot 4 (Java 21) que valida JWT de Keycloak y expone `/api/menu`.

## Levantar

1. `cd keycloak`, copia `.env.example` a `.env` y ajusta las contrasenas.
2. `docker compose up -d` y entra a http://localhost:8080/admin.
3. `cd ../kc-demo` y `.\mvnw.cmd spring-boot:run` (puerto 8081).

Solo para uso local. No usar esta configuracion en produccion.

# kc-menu

API Spring Boot 4 (Java 21) que valida el JWT de Keycloak y arma el menú de opciones según los roles del token. Escucha en el puerto 8081 y expone `GET /api/menu`.

Requiere un realm `lab` disponible en Keycloak local (ver `infra/keycloak/`). Los roles se leen de `resource_access.chat-api.roles`.

## Iniciar

Desde `services/kc-menu/`:

```powershell
.\mvnw.cmd spring-boot:run
```

## Configuración

| Variable | Para qué sirve | Valor por defecto |
| --- | --- | --- |
| `KEYCLOAK_ISSUER_URI` | Emisor (`issuer`) del JWT, con el que Spring valida la firma | `http://localhost:8080/realms/lab` |

Es la misma variable y el mismo valor por defecto que usa `services/kc-finanzas/`. Solo hace falta definirla si Keycloak no está en `http://localhost:8080`.

## Pruebas

Desde `services/kc-menu/`:

```powershell
.\mvnw.cmd test
```

No necesitan Docker ni Keycloak encendido.

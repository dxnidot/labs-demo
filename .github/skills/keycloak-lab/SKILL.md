---
name: keycloak-lab
description: Cómo levantar, detener y probar el lab local de Keycloak (keycloak, kc-demo, kc-front) en D:\dev\labs, incluidos puertos, realm, usuarios de prueba, clients y cómo obtener un token con PowerShell. Úsala cuando pregunten cómo arrancar el lab, en qué puerto está algo, cómo sacar un token o por qué no carga el login.
---

# Lab de Keycloak

Entorno solo local en Windows, monorepo `D:\dev\labs`. Terminal: PowerShell.

## Servicios y puertos

| Servicio | Carpeta | Puerto | Cómo se levanta |
| --- | --- | --- | --- |
| Keycloak 26 + PostgreSQL | `keycloak/` | 8080 | `docker compose up -d` |
| kc-demo (Spring Boot 4, Java 21) | `kc-demo/` | 8081 | `.\mvnw.cmd spring-boot:run` |
| kc-front (Angular) | `kc-front/` | 4200 | `npm start` |

Consola de administración: http://localhost:8080/admin

## Realm y datos de prueba

- Realm: `lab` (confirmar arriba a la izquierda que no estás en `master`).
- Usuarios: `ana` (ejecutivo, rol `ver-menu`) y `beto` (supervisor, roles `ver-menu` y `autorizar`).
- Clients: `chat-api` (API, roles en `resource_access.chat-api.roles`), `chat-front` (front Angular, público con PKCE). `agents-ui` está pendiente (backlog KC-02).
- Las contraseñas y el secret de `chat-api` **no están en el repo**. Se leen de variables de entorno; nunca las escribas en archivos ni en respuestas.

## Arrancar el lab

```powershell
cd D:\dev\labs\keycloak
docker compose up -d
cd ..\kc-demo
.\mvnw.cmd spring-boot:run
```

En otra terminal, si se necesita el front:

```powershell
cd D:\dev\labs\kc-front
npm start
```

Keycloak tarda cerca de un minuto en quedar listo después de `up -d`.

## Detener

```powershell
cd D:\dev\labs\keycloak
docker compose stop
```

En kc-demo y kc-front: `Ctrl+C`.

## Obtener un token (solo lab)

Requiere que el client tenga habilitado Direct access grants y las variables de entorno definidas en la sesión.

```powershell
$body = @{
  grant_type    = 'password'
  client_id     = 'chat-api'
  client_secret = $env:KC_CHAT_API_SECRET
  username      = 'ana'
  password      = $env:KC_ANA_PASSWORD
}
$r = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/realms/lab/protocol/openid-connect/token' -Body $body
$r.access_token
```

Probar la API con el token:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/api/menu' -Headers @{ Authorization = "Bearer $($r.access_token)" }
```

## Reglas que no se rompen

- **Nunca** `docker compose down -v`: `-v` borra el volumen `keycloak_kc-pgdata` y con él el realm, usuarios y permisos. Para apagar usa `stop` (o `down` sin `-v`).
- La carpeta debe seguir llamándose `keycloak`: Docker Compose arma el nombre del volumen con ella. Si cambia, levanta un Keycloak vacío.
- El puerto 8080 está atado a `127.0.0.1`; no exponerlo a la red.
- No imprimir ni guardar tokens, secrets ni contraseñas. Si hace falta mostrar un token, solo sus claims decodificados.

## Problemas comunes

- **El login no carga:** revisar `docker compose ps` en `keycloak/` y esperar a que Keycloak termine de arrancar.
- **401 en kc-demo:** token vencido, o el client/realm no coincide con el emisor esperado por kc-demo.
- **403 en kc-demo:** el usuario no tiene el rol que pide el endpoint (por ejemplo, `ana` no tiene `autorizar`).

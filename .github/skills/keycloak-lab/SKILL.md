---
name: keycloak-lab
description: Cómo levantar, detener y probar el lab local (Keycloak, kc-menu, kc-finanzas, orquestador y Lara) en D:\dev\labs, incluidos puertos, realm, usuarios de prueba, clients y cómo obtener un token con PowerShell. Úsala cuando pregunten cómo arrancar el lab, en qué puerto está algo, cómo sacar un token o por qué no carga el login.
---

# Lab de Keycloak

Entorno solo local en Windows, monorepo `D:\dev\labs`. Terminal: PowerShell.

## Servicios y puertos

| Servicio | Carpeta | Puerto | Cómo se levanta |
| --- | --- | --- | --- |
| Keycloak 26 + PostgreSQL | `infra/keycloak/` | 8080 | `docker compose up -d` |
| kc-menu (Spring Boot 4, Java 21) | `services/kc-menu/` | 8081 | `.\mvnw.cmd spring-boot:run` |
| kc-finanzas (Spring Boot 4, Java 21) | `services/kc-finanzas/` | 8083 (BD PostgreSQL en 5433) | `docker compose up -d` y luego `.\mvnw.cmd spring-boot:run` |
| Lara (React + Vite) | `apps/lara-web/` | 5173 | `npm run dev` |
| Orquestador ADK (Python) | `agents/orquestador/` | 8010 (API server); 8000 con `adk web` | `adk web` (ver AG-01); comando del API server POR CONFIRMAR |

Consola de administración: http://localhost:8080/admin

kc-menu y kc-finanzas leen el emisor del JWT de la variable `KEYCLOAK_ISSUER_URI` (por defecto `http://localhost:8080/realms/lab`). Solo defínela si Keycloak no está en `localhost:8080`.

## Realm y datos de prueba

- Realm: `lab` (confirmar arriba a la izquierda que no estás en `master`).
- El realm se crea al primer arranque desde `infra/keycloak/import/lab-realm.json` (`--import-realm`); si el realm ya existe, la importación se omite.
- Usuarios de prueba: `ana` (grupo `ejecutivo`, rol `ver-menu`), `beto` (grupo `supervisor`, roles `ver-menu` y `autorizar`) y `admin` (todos los roles). Sus contraseñas salen de `KC_ANA_PASSWORD`, `KC_BETO_PASSWORD` y `KC_LAB_ADMIN_PASSWORD` en `infra/keycloak/.env`. Tu usuario real lo creas tú en la consola de admin.
- Clients:
  - `chat-api`: API de kc-menu; sus roles llegan en `resource_access.chat-api.roles`.
  - `agents-ui`: client público de Lara (PKCE, redirect `http://localhost:5173/*`), hecho en KC-02. Lleva un mapper de audiencia para que el access token traiga `aud=agents-ui` (KC-04).
  - `finanzas-agent`: client confidencial con service account que usa el orquestador para llamar a kc-finanzas; su client role es `usar-finanzas` (FIN-13).
- Las contraseñas y los secrets de los clients **no están en el repo**: el JSON del realm solo trae marcadores `${VAR}` y los valores viven en `infra/keycloak/.env` (`KC_CHAT_API_SECRET`, `FINANZAS_AGENT_CLIENT_SECRET`, y las tres contraseñas). Nunca las escribas en archivos versionados ni en respuestas.

## Arrancar el lab

```powershell
cd D:\dev\labs\infra\keycloak
docker compose up -d
cd D:\dev\labs\services\kc-menu
.\mvnw.cmd spring-boot:run
```

En otra terminal, si se necesita finanzas (requiere su `.env`, ver `services/kc-finanzas/README.md`):

```powershell
cd D:\dev\labs\services\kc-finanzas
docker compose up -d
.\mvnw.cmd spring-boot:run
```

En otra terminal, para Lara:

```powershell
cd D:\dev\labs\apps\lara-web
npm run dev
```

Keycloak tarda cerca de un minuto en quedar listo después de `up -d`.

## Detener

```powershell
cd D:\dev\labs\infra\keycloak
docker compose stop
cd D:\dev\labs\services\kc-finanzas
docker compose stop
```

En kc-menu, kc-finanzas y Lara: `Ctrl+C`.

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

- **Nunca** `docker compose down -v`: `-v` borra los volúmenes de datos y con ellos el realm, usuarios y permisos (Keycloak) o los datos de finanzas. Para apagar usa `stop` (o `down` sin `-v`).
- El nombre del proyecto Compose está fijado con `name:` al inicio de cada `compose.yaml` (`keycloak` y `finanzas`), así que mover o renombrar la carpeta ya no cambia el nombre de los volúmenes. Los volúmenes deberían ser `keycloak_keycloak-pgdata` y `finanzas_finanzas-pgdata` (inferido; confírmalo con `docker volume ls`). Si cambias el `name:`, levantas una BD vacía.
- El puerto 8080 está atado a `127.0.0.1`; no exponerlo a la red.
- No imprimir ni guardar tokens, secrets ni contraseñas. Si hace falta mostrar un token, solo sus claims decodificados.

## Problemas comunes

- **El login no carga:** revisar `docker compose ps` en `infra/keycloak/` y esperar a que Keycloak termine de arrancar.
- **401 en kc-menu:** token vencido, o el client/realm no coincide con el emisor esperado por kc-menu.
- **403 en kc-menu:** el usuario no tiene el rol que pide el endpoint (por ejemplo, `ana` no tiene `autorizar`).
- **401 en el orquestador:** el access token no trae `aud=agents-ui`; revisar el mapper de audiencia del client `agents-ui` y volver a iniciar sesión en Lara.

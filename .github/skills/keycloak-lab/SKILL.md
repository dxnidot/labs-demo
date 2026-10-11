---
name: "keycloak-lab"
description: "Cómo levantar, detener y probar el lab local (Keycloak, kc-menu, kc-finanzas, orquestador y Lara) en D:\\dev\\labs, incluidos puertos, realm, usuarios de prueba, clients y cómo obtener un token con PowerShell. Úsala cuando pregunten cómo arrancar el lab, en qué puerto está algo, cómo sacar un token o por qué no carga el login."
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
| Orquestador ADK (Python) | `agents/` | 8010 (API server); 8000 con `adk web` | desde `agents/` con `.venv` activo: `python -m uvicorn --factory orquestador.api:create_app --host 127.0.0.1 --port 8010` (confirmado en la PC) |

Consola de administración: http://localhost:8080/admin

kc-menu y kc-finanzas leen el emisor del JWT de la variable `KEYCLOAK_ISSUER_URI` (por defecto `http://localhost:8080/realms/lab`). Solo defínela si Keycloak no está en `localhost:8080`.

## Realm y datos de prueba

- Realm: `lab` (confirmar arriba a la izquierda que no estás en `master`).
- El realm se crea al primer arranque desde `infra/keycloak/import/lab-realm.json` (`--import-realm`); si el realm ya existe, la importación se omite. Los valores de las variables `LAB_*` solo se leen en ese primer import: cambiar el `.env` después no actualiza el realm.
- Usuarios de prueba: `ana` (grupo `ejecutivo`, rol `ver-menu`), `beto` (grupo `supervisor`, roles `ver-menu` y `autorizar`) y `admin` (todos los roles). Sus contraseñas salen de `LAB_ANA_PASSWORD`, `LAB_BETO_PASSWORD` y `LAB_ADMIN_PASSWORD` en `infra/keycloak/.env`. Tu usuario real lo creas tú en la consola de admin.
- Clients:
  - `kc-menu`: API de kc-menu (antes `chat-api`); sus roles llegan en `resource_access.kc-menu.roles`.
  - `lara-web`: client público de Lara (antes `agents-ui`; PKCE S256, redirect `http://localhost:5173/*`), hecho en KC-02. Lleva el mapper `audience-lara-web` para que el access token traiga `aud=lara-web` (KC-04).
  - `finanzas-agent`: client confidencial con service account que usa el orquestador para llamar a kc-finanzas; su client role es `usar-finanzas` (FIN-13).
- Las contraseñas y los secrets de los clients **no están en el repo**: el JSON del realm solo trae marcadores `${VAR}` y los valores viven en `infra/keycloak/.env` (`LAB_MENU_CLIENT_SECRET`, `FINANZAS_AGENT_CLIENT_SECRET`, y las tres contraseñas). Nunca las escribas en archivos versionados ni en respuestas.

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

Requiere que el client `kc-menu` tenga habilitado Direct access grants. Este bloque lee los valores de `infra/keycloak/.env` sin escribirlos en la terminal ni en el chat:

```powershell
cd D:\dev\labs\infra\keycloak
$envs = @{}
Get-Content .env | Where-Object { $_ -match '^\s*[A-Z_]+=' } | ForEach-Object { $k,$v = $_ -split '=',2; $envs[$k.Trim()] = $v.Trim() }
$body = @{
  grant_type    = 'password'
  client_id     = 'kc-menu'
  client_secret = $envs['LAB_MENU_CLIENT_SECRET']
  username      = 'ana'
  password      = $envs['LAB_ANA_PASSWORD']
}
$r = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/realms/lab/protocol/openid-connect/token' -Body $body
$r.access_token.Length   # si imprime un número, funcionó
```

Probar la API con el token (dura unos 5 minutos; si da 401, pídelo de nuevo):

```powershell
Invoke-RestMethod -Uri 'http://localhost:8081/api/menu' -Headers @{ Authorization = "Bearer $($r.access_token)" }
```

## Reglas que no se rompen

- **Nunca** `docker compose down -v`: `-v` borra los volúmenes de datos y con ellos el realm, usuarios y permisos (Keycloak) o los datos de finanzas. Para apagar usa `stop` (o `down` sin `-v`).
- El nombre del proyecto Compose está fijado con `name:` al inicio de cada `compose.yaml` (`keycloak` y `finanzas`), así que mover o renombrar la carpeta ya no cambia el nombre de los volúmenes. Los volúmenes son `keycloak_keycloak-pgdata` y `finanzas_finanzas-pgdata` (confírmalo con `docker volume ls`). Si cambias el `name:`, levantas una BD vacía.
- El puerto 8080 está atado a `127.0.0.1`; no exponerlo a la red.
- No imprimir ni guardar tokens, secrets ni contraseñas. Si hace falta mostrar un token, solo sus claims decodificados.

## Problemas comunes

- **El login no carga:** revisar `docker compose ps` en `infra/keycloak/` y esperar a que Keycloak termine de arrancar.
- **Keycloak no arranca con `password authentication failed for user "keycloak"`:** el volumen de Postgres se creó con otra contraseña; `POSTGRES_PASSWORD` solo se lee al crear el volumen. Si no hay datos que conservar, `docker compose down`, borra ese volumen por nombre (`docker volume rm keycloak_keycloak-pgdata`) y `docker compose up -d`. Lo mismo aplica a kc-finanzas con `finanzas_finanzas-pgdata`.
- **`unauthorized_client` al pedir un token:** casi siempre el comando se ejecutó con marcadores como `<LAB_MENU_CLIENT_SECRET>` sin sustituir, o el secret del `.env` no coincide con el que el realm importó (Clients, `kc-menu`, Credentials). Si el realm se importó con otros valores, bórralo en la consola y recrea el contenedor con `docker compose up -d`.
- **401 en kc-menu:** token vencido (dura unos 5 minutos), o el client/realm no coincide con el emisor esperado por kc-menu.
- **403 en kc-menu:** el usuario no tiene el rol que pide el endpoint (por ejemplo, `ana` no tiene `autorizar`).
- **401 en el orquestador:** el access token no trae `aud=lara-web`; revisar el mapper de audiencia del client `lara-web`, que `KEYCLOAK_AUDIENCE=lara-web` esté en el `.env` del orquestador y volver a iniciar sesión en Lara.
- **`ECONNREFUSED` en la consola de Vite (`/apps/orquestador`, `/api/llm`):** el orquestador no está corriendo en el 8010.
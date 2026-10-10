# Keycloak del lab

Keycloak 26 + PostgreSQL con Docker Compose. El realm `lab` se importa solo, desde [`import/lab-realm.json`](import/lab-realm.json).

## Primer arranque (base vacía)

```powershell
Copy-Item .env.example .env
# Edita .env: pon tus propios secrets y contraseñas (los de ejemplo no sirven).
docker compose up -d
```

- Compose se detiene si falta alguna variable del realm (`KC_CHAT_API_SECRET`, `FINANZAS_AGENT_CLIENT_SECRET`, `KC_ANA_PASSWORD`, `KC_BETO_PASSWORD`, `KC_LAB_ADMIN_PASSWORD`): un marcador `${VAR}` sin resolver quedaría como texto literal en el secret.
- Consola de administración: http://localhost:8080/admin (usuario y contraseña de `KC_BOOTSTRAP_ADMIN_*`, realm `master`).
- `FINANZAS_AGENT_CLIENT_SECRET` debe ser el mismo valor que `agents/orquestador/.env`.

## Qué trae el realm

Clients, roles de realm y de client, grupos, los usuarios de prueba y el mapper de audiencia de Lara. Detalle y nombres: skill `keycloak-lab` y [ADR-0006](../../docs/decisions/0006-convencion-de-nombres.md). No incluye (pendiente): la configuración de Authorization Services (RPT) de la prueba original.

## Reglas del import

- `--import-realm` lee los `*.json` de `/opt/keycloak/data/import`; el archivo debe llamarse `<realm>-realm.json`.
- Si el realm ya existe, **la importación se omite** (para no perder estado). Un cambio en el JSON no se aplica a un realm existente.
- Para recrearlo desde el JSON: borra el realm `lab` en la consola de admin y reinicia con `docker compose restart keycloak`. Esto elimina sus usuarios y datos.
- Marcadores `${VAR}`: se resuelven con las variables de entorno del contenedor.
- Nunca `docker compose down -v`: borra el volumen `keycloak-pgdata`.

Fuente: [Importing and exporting realms](https://www.keycloak.org/server/importExport) (guía de Keycloak 26.7.4).

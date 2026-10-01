# Microservicio de finanzas

Requiere Java 21, Docker y un realm `lab` disponible en Keycloak local.

## Iniciar

Desde `finanzas/`, copia la plantilla de entorno y configura credenciales locales ficticias:

```powershell
Copy-Item .env.example .env
```

Inicia PostgreSQL:

```powershell
docker compose up -d
```

En otra terminal, desde `finanzas/`, inicia la aplicación:

```powershell
.\mvnw.cmd spring-boot:run
```

La API escucha en `http://127.0.0.1:8083`.

## Probar los endpoints

Define `KC_CHAT_API_SECRET` y `KC_ANA_PASSWORD` como variables de entorno con credenciales locales de prueba. El siguiente comando obtiene un token de Keycloak y lo conserva en memoria sin imprimirlo:

```powershell
$body = @{ grant_type='password'; client_id='chat-api'; client_secret=$env:KC_CHAT_API_SECRET; username='ana'; password=$env:KC_ANA_PASSWORD }
$env:KEYCLOAK_TOKEN = (Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/realms/lab/protocol/openid-connect/token' -Body $body).access_token
```

El token dura pocos minutos; si una solicitud responde `401`, vuelve a pedirlo.
Todos los ejemplos usan datos ficticios. No imprimas ni compartas el token.

```powershell
$base = "http://127.0.0.1:8083/api/finanzas"
$headers = @{ Authorization = "Bearer $($env:KEYCLOAK_TOKEN)" }

# GET colección de tarjetas
Invoke-RestMethod "$base/tarjetas" -Headers $headers

# POST tarjeta ficticia
$cardBody = @{
  alias = "Tarjeta demo"
  ultimos4 = "1234"
  diaCorte = 15
  diaPago = 25
  permiteLiquidarMsiAnticipado = $false
  activa = $true
} | ConvertTo-Json
$tarjeta = Invoke-RestMethod "$base/tarjetas" -Method Post -Headers $headers `
  -ContentType "application/json" -Body $cardBody
$id = $tarjeta.id

# GET tarjeta por id
Invoke-RestMethod "$base/tarjetas/$id" -Headers $headers

# PUT tarjeta por id
Invoke-RestMethod "$base/tarjetas/$id" -Method Put -Headers $headers `
  -ContentType "application/json" -Body $cardBody

# GET calendario de los próximos 30 días
$desde = Get-Date -Format "yyyy-MM-dd"
Invoke-RestMethod "$base/calendario?desde=$desde&dias=30" -Headers $headers

# DELETE tarjeta ficticia
Invoke-RestMethod "$base/tarjetas/$id" -Method Delete -Headers $headers | Out-Null
```

## Pruebas

Desde `finanzas/`:

```powershell
.\mvnw.cmd test
```

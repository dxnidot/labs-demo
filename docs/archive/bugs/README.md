# Bugs

## Plantilla

### Título del bug

- Síntoma: qué ocurre y cuándo.
- Causa probable: qué lo provoca.
- Fix propuesto: cambio mínimo para resolverlo.
- Archivos: rutas afectadas.
- Estado: Abierto | En revisión | Corregido.
- Pendiente: qué falta validar.

### Selector de modelo del chat siempre mostraba solo DeepSeek Flash

- Síntoma: el dropdown de modelos en `ChatPage` siempre mostraba una sola opción (`deepseek-flash`, en minúsculas, sin el nombre bonito del catálogo), sin importar el rol del usuario ni qué se seleccionara.
- Causa probable: tres bugs distintos en cadena, todos reales, pero el que de verdad bloqueaba la carga en desarrollo era el tercero:
  1. `agents/orquestador/api.py` interceptaba el preflight `OPTIONS` del navegador con el middleware de auth antes de que `CORSMiddleware` respondiera (devolvía 401 sin headers de CORS).
  2. Incluso arreglado (1), cualquier respuesta de error nuestra (401/403/503) seguía sin headers de CORS porque nuestro middleware de auth queda "afuera" de `CORSMiddleware` en el stack de Starlette (`add_middleware` siempre prepone, así que lo último que se agrega queda más externo) y corta la cadena sin pasar por él cuando responde directo.
  3. **La causa real en desarrollo**: `agents-ui/vite.config.ts` tenía un proxy genérico `"/api": { target: "http://localhost:8081" }` (kc-demo) registrado después de `"/api/finanzas"` pero sin una regla específica para `/api/llm`. Como el proxy de Vite usa la primera coincidencia por prefijo, `/api/llm/available-models` caía en la regla genérica y se enviaba a kc-demo (8081), no al orquestador (8010). Nunca llegaba al backend correcto, así que el frontend caía siempre al modelo de respaldo hardcodeado.
- Fix aplicado:
  - `agents/orquestador/api.py`: el middleware de auth deja pasar `OPTIONS` sin verificar token. Las respuestas de error que el middleware corta antes de `call_next` (401/403/503/400) ahora adjuntan a mano los headers de CORS (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Vary: Origin`) vía un helper `_cors_headers(request)`, calculados contra `CORS_ALLOWED_ORIGINS`.
  - `agents-ui/vite.config.ts`: se agregó una regla `"/api/llm": { target: "http://localhost:8010" }` antes de la genérica `/api`.
  - Tests de regresión: `agents/tests/test_api.py::test_cors_preflight_bypasses_auth` y `test_error_responses_still_carry_cors_headers`.
- **Regresión introducida y corregida en el mismo hilo**: un primer intento de arreglar (2) agregó un `CORSMiddleware` propio llamando a `get_fast_api_app(...)` **sin** `allow_origins`. Eso rompió una protección interna de ADK contra DNS-rebinding (`_is_request_origin_allowed` en `google/adk/cli/api_server.py`): sin `allow_origins` configurado, ADK exige que el `Origin` del request coincida literalmente con el host del propio servidor, y rechazaba con 403 cualquier `POST` cross-port (p. ej. `http://localhost:5173` → `127.0.0.1:8010`), incluida la creación de sesiones. Se corrigió volviendo a pasar `allow_origins=origins` a `get_fast_api_app(...)` (así ADK usa su propio CORSMiddleware y su chequeo interno queda conforme) y quitando el `CORSMiddleware` manual, dejando solo los headers adjuntados a mano en las respuestas de error propias. Verificado en vivo: `POST .../sessions` sin token ahora da 401 (no 403) con headers CORS correctos, y el preflight `OPTIONS` sigue en 200.
- Archivos: `agents/orquestador/api.py`, `agents-ui/vite.config.ts`, `agents/tests/test_api.py`.
- Estado: Corregido.
- Pendiente: confirmar en el navegador (no solo con `curl`) que el selector ya trae el catálogo real; y, por separado, crear/asignar los roles `llm_basic`/`llm_advanced` en Keycloak (ver `KC-04`) para ver más de un modelo en la lista.

### Chat de finanzas se tarda demasiado y el estado del front no refleja lo que ya pasó en el backend

- Síntoma: al chatear en el panel de Finanzas, la respuesta tarda mucho más de lo esperado; los logs del backend muestran que el procesamiento ya avanzó (herramientas invocadas, eventos guardados en la sesión de ADK), pero la UI se queda sin actualizar el mensaje del agente hasta que falla o se recarga.
- Causa probable (confirmada por código, no reproducida en vivo): `agents/orquestador/model_router.py` capturaba `litellm.exceptions.APIError` para decidir cuándo reintentar con el siguiente modelo del catálogo. Esa clase **no es la base real** de los errores que de verdad lanzan los proveedores: `AuthenticationError`, `Timeout`, `APIConnectionError`, `RateLimitError`, etc. heredan de `openai.APIError`, no de `litellm.exceptions.APIError` (son clases hermanas, confirmado con `issubclass()` en el venv del proyecto). Por lo tanto, un error real de proveedor (clave inválida, rate limit, timeout del lado de OpenAI/DeepSeek/Gemini) **no activaba el fallback**: se propagaba sin capturar hasta el runner de ADK, que sí deja rastro en los logs del backend (herramientas ya ejecutadas, eventos ya persistidos en la sesión) pero nunca llega a emitir el evento final de texto que el frontend espera — de ahí que el backend "avance" y el front se quede esperando.
- Fix aplicado: cambiar el import en `model_router.py` de `from litellm.exceptions import APIError` a `from openai import APIError` (la base real y común a todas las excepciones de proveedor que usa litellm).
- Archivos: `agents/orquestador/model_router.py`, `agents/tests/test_model_router.py` (nuevo test `test_router_falls_back_on_invalid_api_key` con una `AuthenticationError` real, no un `TimeoutError` genérico).
- Estado: Corregido (a nivel de código y tests); no se reprodujo en vivo el caso exacto de Finanzas, así que falta confirmar en el navegador que ya no se queda colgado con una clave de API inválida o un modelo caído.
- Pendiente: validar en el navegador con una clave DeepSeek/Gemini inválida a propósito, confirmando que ahora sí cae al siguiente modelo del catálogo en vez de quedarse esperando.

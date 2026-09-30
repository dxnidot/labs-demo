# ADR-0004: Trazabilidad y logs

- Contexto: `Confirmado:` Lara, el API server, el orquestador y kc-demo necesitan correlacionar una misma petición a través de servicios y protocolos.
- Decisión:
  - Usa W3C Trace Context (`traceparent`) con OpenTelemetry en Java, Python y TypeScript.
  - Propaga el contexto por HTTP, A2A y headers de Kafka.
  - Emite logs JSON con `traceId`, `spanId`, servicio y nivel.
  - Usa `ERROR` para fallas con causa; `WARN` para recuperaciones o rechazos; `INFO` solo para hechos de negocio con conteos; deja `DEBUG` apagado por defecto.
  - Nunca registres tokens, secrets, contraseñas, bodies completos, prompts completos del agente ni datos de cuenta.
  - Deja el visor de trazas (Jaeger) como opcional y posterior.
- Alternativas consideradas: `Inferido:` logs sin contexto de traza distribuida y desplegar Jaeger desde el inicio.
- Consecuencias: `Inferido:` el contexto compartido permite correlacionar los registros; faltará cobertura hasta instrumentar y verificar cada integración.
- Estado: Aceptada
- Pendiente: verificar en documentación oficial la integración de Micrometer Tracing en Spring Boot y de OpenTelemetry en ADK Python para las versiones instaladas.

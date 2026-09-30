# ADR-0003: Arquitectura por eventos

- Contexto: `Confirmado:` finanzas, bpm-sync y la auditoría de Keycloak tienen casos donde un hecho puede interesar a varios consumidores; chat, menú por rol y aclaraciones requieren respuesta directa.
- Decisión:
  - Usa eventos cuando algo ya pasó y varios consumidores reaccionan; usa llamadas directas cuando quien llama espera una respuesta.
  - Antes del primer caso de finanzas con dos o más consumidores, mantén los eventos dentro de cada servicio, sin broker.
  - Cuando exista ese caso, usa Kafka en modo KRaft con un contenedor local.
  - Nombra los eventos en pasado, por ejemplo `CargoRegistrado`; haz idempotentes a los consumidores, usa el patrón outbox y no incluyas datos sensibles en los eventos.
- Alternativas consideradas: RabbitMQ, NATS, Redis Streams y no usar broker.
- Consecuencias: `Inferido:` separar productores y consumidores facilita incorporar reacciones adicionales; el broker, la idempotencia y el outbox agregan operación y complejidad.
- Estado: Aceptada

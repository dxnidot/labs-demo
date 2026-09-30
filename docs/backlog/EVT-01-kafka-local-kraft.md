# EVT-01 · Kafka local en KRaft y evento de prueba publicado y consumido desde Java y Python

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Eventos
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: Kafka vive en `kafka/compose.yaml`, separado de `keycloak/`, con el puerto enlazado a `127.0.0.1`.
- Criterio de aceptación:
  - `docker compose up -d` en `kafka/` inicia un contenedor Kafka en modo KRaft, sin ZooKeeper.
  - Un productor Java publica un evento de prueba en el topic `lab.eventos.prueba` con un header `traceparent`.
  - Un consumidor Python lo lee con el mismo payload y el mismo `traceparent`.
- Archivos relevantes: `kafka/`, `kc-demo/`, `agents/`
- Notas: No alojar Kafka ni su Compose en `keycloak/`.

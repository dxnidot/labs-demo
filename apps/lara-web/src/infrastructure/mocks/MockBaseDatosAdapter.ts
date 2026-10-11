// MOCK: devuelve consultas y filas ficticias de tablas de ADK solo en memoria.
import type { BaseDatosPort } from "../../application/ports/BaseDatosPort";
import type { ConsultaTablaAdk, NombreTablaAdk } from "../../domain/TablaAdk";

const consultas: Record<NombreTablaAdk, ConsultaTablaAdk> = {
  events: {
    tabla: "events",
    sql: "SELECT id, session_id, author, timestamp, content FROM events ORDER BY timestamp DESC LIMIT 20;",
    columnas: ["id", "session_id", "author", "timestamp", "content"],
    filas: [
      ["evt_demo_001", "ses_demo_042", "assistant", "2030-10-01 14:32:10", "Respuesta generada"],
      ["evt_demo_002", "ses_demo_042", "user", "2030-10-01 14:31:48", "Consultar el estado del laboratorio"],
    ],
  },
  app_states: {
    tabla: "app_states",
    sql: "SELECT app_name, state, update_time FROM app_states ORDER BY update_time DESC LIMIT 20;",
    columnas: ["app_name", "state", "update_time"],
    filas: [
      ["orquestador", "{\"turnos\":3,\"ultimo_agente\":\"coordinador\"}", "2030-10-01 14:32:10"],
      ["asistente_demo", "{\"preferencia\":\"respuestas breves\"}", "2030-10-01 14:28:02"],
    ],
  },
  user_states: {
    tabla: "user_states",
    sql: "SELECT user_id, state, update_time FROM user_states ORDER BY update_time DESC LIMIT 20;",
    columnas: ["user_id", "state", "update_time"],
    filas: [
      ["usuario_demo_01", "{\"idioma\":\"es\",\"zona\":\"local\"}", "2030-10-01 14:32:10"],
      ["usuario_demo_02", "{\"idioma\":\"es\",\"zona\":\"local\"}", "2030-10-01 14:28:02"],
    ],
  },
};

/** Adaptador de demostración con resultados inventados para las tablas de ADK.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockBaseDatosAdapter implements BaseDatosPort {
  async consultarTabla(tabla: NombreTablaAdk): Promise<ConsultaTablaAdk> {
    return consultas[tabla];
  }
}

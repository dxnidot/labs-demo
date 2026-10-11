/** Describe una consulta de solo lectura y sus resultados tabulares de ADK. */
export type NombreTablaAdk = "events" | "app_states" | "user_states";

export interface ConsultaTablaAdk {
  tabla: NombreTablaAdk;
  sql: string;
  columnas: string[];
  filas: string[][];
}

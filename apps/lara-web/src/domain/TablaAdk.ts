/** Tablas de la base de datos del orquestador que aún no se consultan desde Lara. */
export type NombreTablaAdk = "events" | "app_states" | "user_states";

/** Resultado de una consulta de solo lectura a una tabla del orquestador. */
export interface ConsultaTablaAdk {
  tabla: NombreTablaAdk;
  /** Consulta SQL mostrada en pantalla; siempre un SELECT. */
  sql: string;
  columnas: string[];
  filas: string[][];
}

/** Acción que tomaría la sincronización con BPM para un usuario, en un dry-run. */
export type AccionBpm = "crear" | "actualizar" | "sin-cambios" | "huerfana";

export interface FilaSincronizacionBpm {
  usuario: string;
  accion: AccionBpm;
  detalle: string;
}

/** Resultado de un dry-run: nada se escribe en Keycloak, solo se cuenta y se lista. */
export interface ResultadoDryRunBpm {
  crear: number;
  actualizar: number;
  sinCambios: number;
  huerfanas: number;
  filas: FilaSincronizacionBpm[];
}

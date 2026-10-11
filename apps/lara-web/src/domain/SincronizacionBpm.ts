/** Acciones posibles al comparar los datos de BPM con las cuentas de Keycloak. */
export type AccionBpm = "crear" | "actualizar" | "sin-cambios" | "huerfana";

/** Cambio simulado para una cuenta. */
export interface FilaSincronizacionBpm {
  usuario: string;
  accion: AccionBpm;
  detalle: string;
}

/** Resumen y filas que produciría una ejecución de prueba. */
export interface ResultadoDryRunBpm {
  crear: number;
  actualizar: number;
  sinCambios: number;
  huerfanas: number;
  filas: FilaSincronizacionBpm[];
}

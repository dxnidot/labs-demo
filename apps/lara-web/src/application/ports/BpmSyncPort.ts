import type { ResultadoDryRunBpm } from "../../domain/SincronizacionBpm";

/**
 * Ejecuta una simulación de sincronización sin modificar cuentas.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface BpmSyncPort {
  ejecutarDryRun(): Promise<ResultadoDryRunBpm>;
}

import type { ResultadoDryRunBpm } from "../../domain/SincronizacionBpm";

/** Simulación (dry-run) de la sincronización BPM → Keycloak; nunca escribe de verdad. */
export interface BpmSyncPort {
  ejecutarDryRun(): Promise<ResultadoDryRunBpm>;
}

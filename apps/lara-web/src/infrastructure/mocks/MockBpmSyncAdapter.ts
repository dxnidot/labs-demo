// MOCK: resultado de sincronización BPM ficticio; solo simula y nunca modifica cuentas.
import type { BpmSyncPort } from "../../application/ports/BpmSyncPort";
import type { ResultadoDryRunBpm } from "../../domain/SincronizacionBpm";

const resultado: ResultadoDryRunBpm = {
  crear: 2,
  actualizar: 1,
  sinCambios: 1,
  huerfanas: 1,
  filas: [
    { usuario: "usuario-prueba-a", accion: "crear", detalle: "Grupo de ejemplo (puesto mapeado)" },
    { usuario: "usuario-prueba-b", accion: "crear", detalle: "Grupo de ejemplo (puesto sin mapeo)" },
    { usuario: "usuario-prueba-c", accion: "actualizar", detalle: "Cambio de puesto: se movería de grupo" },
    { usuario: "usuario-prueba-d", accion: "sin-cambios", detalle: "—" },
    { usuario: "usuario-prueba-e", accion: "huerfana", detalle: "Existe en Keycloak pero no en BPM. Revisar a mano" },
  ],
};

/** Adaptador de ejemplo del puerto BPM, con cuentas genéricas y sin efectos externos.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockBpmSyncAdapter implements BpmSyncPort {
  ejecutarDryRun(): Promise<ResultadoDryRunBpm> {
    return Promise.resolve({ ...resultado, filas: resultado.filas.map((fila) => ({ ...fila })) });
  }
}

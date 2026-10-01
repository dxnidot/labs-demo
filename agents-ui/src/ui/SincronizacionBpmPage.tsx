import { EstadoVacio } from "./components/EstadoVacio";
import { VistaPantalla } from "./components/VistaPantalla";

/**
 * Pantalla "Sincronización BPM": estado vacío hasta que bpm-sync exponga su dry-run.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function SincronizacionBpmPage() {
  return (
    <VistaPantalla
      subtitulo="Qué cambiaría en Keycloak al sincronizar con la base BPM simulada."
      titulo="Sincronización BPM"
    >
      <EstadoVacio fuente="bpm-sync dry-run" pendiente="BPM-01" />
    </VistaPantalla>
  );
}

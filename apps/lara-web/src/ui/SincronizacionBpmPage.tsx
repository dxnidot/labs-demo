import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

/**
 * Pantalla "Sincronización BPM": estado vacío hasta que bpm-sync exponga su dry-run.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Vacío sin jerga.
 */
export function SincronizacionBpmPage() {
  return (
    <PageLayout
      subtitulo="Qué cambiaría en Keycloak al sincronizar con la base BPM simulada."
      titulo="Sincronización BPM"
    >
      <EstadoVacio mensaje="La sincronización con BPM aún no está disponible, así que no hay un dry-run que mostrar." />
    </PageLayout>
  );
}

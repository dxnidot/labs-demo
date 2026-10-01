import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

/**
 * Pantalla "Memoria vectorizada": estado vacío hasta que exista el servicio de memoria.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 */
export function MemoriaPage() {
  return (
    <PageLayout
      subtitulo="Busca por significado en la documentación y en lo que Lara recuerda de tus sesiones."
      titulo="Memoria vectorizada"
    >
      <EstadoVacio fuente="memory service / RAG" pendiente="EXT-01" />
    </PageLayout>
  );
}

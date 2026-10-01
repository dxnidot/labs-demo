import { EstadoVacio } from "./components/EstadoVacio";
import { VistaPantalla } from "./components/VistaPantalla";

/**
 * Pantalla "Memoria vectorizada": estado vacío hasta que exista el servicio de memoria.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function MemoriaPage() {
  return (
    <VistaPantalla
      subtitulo="Busca por significado en la documentación y en lo que Lara recuerda de tus sesiones."
      titulo="Memoria vectorizada"
    >
      <EstadoVacio fuente="memory service / RAG" pendiente="EXT-01" />
    </VistaPantalla>
  );
}

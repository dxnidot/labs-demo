import { EstadoVacio } from "./components/EstadoVacio";
import { VistaPantalla } from "./components/VistaPantalla";

/**
 * Pantalla "Gastos fijos": estado vacío hasta que exista FIN-03.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function GastosFijosPage() {
  return (
    <VistaPantalla
      subtitulo="Pagos que se repiten y su proyección. Confirma los que detectó Lara."
      titulo="Gastos fijos"
    >
      <EstadoVacio fuente="servicio finanzas" pendiente="FIN-03" />
    </VistaPantalla>
  );
}

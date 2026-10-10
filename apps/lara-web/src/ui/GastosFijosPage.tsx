import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

/**
 * Pantalla "Gastos fijos": estado vacío hasta que exista FIN-03.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 */
export function GastosFijosPage() {
  return (
    <PageLayout
      subtitulo="Pagos que se repiten y su proyección. Confirma los que detectó Lara."
      titulo="Gastos fijos"
    >
      <EstadoVacio fuente="servicio finanzas" pendiente="FIN-03" />
    </PageLayout>
  );
}

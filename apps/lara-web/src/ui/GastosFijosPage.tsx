import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

/**
 * Pantalla "Gastos fijos": estado vacío hasta que exista FIN-03.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Vacío sin jerga.
 */
export function GastosFijosPage() {
  return (
    <PageLayout
      subtitulo="Pagos que se repiten y su proyección. Confirma los que detectó Lara."
      titulo="Gastos fijos"
    >
      <EstadoVacio mensaje="La detección de gastos fijos aún no está disponible: todavía no hay pagos recurrentes que confirmar." />
    </PageLayout>
  );
}

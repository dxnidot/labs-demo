import type { Moneda, MovimientoFinanciero, TipoMovimiento } from "../domain/MovimientoFinanciero";
import type { Tarjeta } from "../domain/Tarjeta";
import { Card } from "./components/Card";
import { Tag } from "./components/Tag";
import { enmascarar, etiquetaOrigen, fechaCorta, formatoMoneda } from "./finanzasFormato";

interface FinanzasMovimientosTabProps {
  moneda: Moneda;
  movimientos: MovimientoFinanciero[];
  periodo: string;
  tarjetas: Tarjeta[];
  tipo: TipoMovimiento;
}

/**
 * Tabla de gastos o ingresos del periodo en la moneda elegida, sin filtros ni totales.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function FinanzasMovimientosTab({
  moneda,
  movimientos,
  periodo,
  tarjetas,
  tipo,
}: FinanzasMovimientosTabProps) {
  const esGasto = tipo === "GASTO";
  const filas = movimientos
    .filter(
      (movimiento) =>
        movimiento.tipo === tipo &&
        movimiento.moneda === moneda &&
        movimiento.fecha.startsWith(periodo),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (filas.length === 0) {
    return (
      <Card>
        <p className="m-0 text-sm text-muted">
          No hay {esGasto ? "gastos" : "ingresos"} en {moneda} para este periodo.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" relleno="ninguno">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
          <caption className="sr-only">
            {esGasto ? "Gastos" : "Ingresos"} del periodo en {moneda}
          </caption>
          <thead>
            <tr className="border-b border-divider bg-surface text-muted">
              <th className="px-3.5 py-2.5 font-medium" scope="col">fecha</th>
              <th className="px-3.5 py-2.5 font-medium" scope="col">
                {esGasto ? "comercio" : "concepto"}
              </th>
              <th className="px-3.5 py-2.5 font-medium" scope="col">categoría</th>
              {esGasto && <th className="px-3.5 py-2.5 font-medium" scope="col">tarjeta</th>}
              <th className="px-3.5 py-2.5 font-medium" scope="col">origen</th>
              <th className="px-3.5 py-2.5 text-right font-medium" scope="col">monto</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((movimiento) => {
              const tarjeta = tarjetas.find((actual) => actual.id === movimiento.tarjetaId);
              return (
                <tr
                  className="border-b border-divider text-text-2 last:border-0"
                  key={movimiento.id}
                >
                  <td className="whitespace-nowrap px-3.5 py-3 font-mono">
                    {fechaCorta(movimiento.fecha)}
                  </td>
                  <th className="max-w-[260px] truncate px-3.5 py-3 font-normal" scope="row">
                    {movimiento.comercio}
                  </th>
                  <td className="px-3.5 py-3">{movimiento.categoria}</td>
                  {esGasto && (
                    <td className="px-3.5 py-3 font-mono">
                      {tarjeta ? enmascarar(tarjeta.ultimos4) : "—"}
                    </td>
                  )}
                  <td className="px-3.5 py-3">
                    <Tag>{etiquetaOrigen(movimiento.origen)}</Tag>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3 text-right font-mono">
                    {formatoMoneda[movimiento.moneda].format(movimiento.monto)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import { Link } from "react-router";
import type { ResumenFinanciero } from "../application/use-cases/ObtenerResumenFinanciero";
import type { Moneda } from "../domain/MovimientoFinanciero";
import { Card } from "./components/Card";
import { claseFoco } from "./components/foco";
import { Tag } from "./components/Tag";
import { etiquetaOrigen, fechaCorta, formatoMoneda } from "./finanzasFormato";

interface FinanzasResumenTabProps {
  datos: ResumenFinanciero;
  moneda: Moneda;
  periodo: string;
}

const coloresBarra = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-hoki-600"];
const maximoMovimientos = 5;
const textoSinDatos = "Sin datos todavía · Fuente: finanzas · Pendiente: totales mensuales";
const enlaceClase = `text-[13px] text-accent underline hover:text-accent-hover ${claseFoco}`;

/**
 * Resumen de finanzas: próximo pago, gastos por categoría, próximos pagos y últimos movimientos.
 * Los totales que requieren calcular importes quedan en estado vacío hasta que el servicio los expone.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function FinanzasResumenTab({ datos, moneda, periodo }: FinanzasResumenTabProps) {
  const proximoPago = datos.eventos.find((evento) => evento.tipo === "PAGO");
  const categorias = datos.resumen
    .filter((fila) => fila.tipo === "GASTO" && fila.moneda === moneda)
    .sort((a, b) => b.total - a.total);
  const mayor = categorias[0]?.total ?? 0;
  const ultimos = datos.movimientos
    .filter((movimiento) => movimiento.fecha.startsWith(periodo) && movimiento.moneda === moneda)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, maximoMovimientos);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1180px]:grid-cols-4">
        {["Ingresos del mes", "Gastos del mes", "Te queda"].map((titulo) => (
          <Card key={titulo}>
            <span className="text-[13px] text-muted">{titulo}</span>
            <span className="font-mono text-[26px] font-medium text-faint">—</span>
            <span className="text-xs text-faint">{textoSinDatos}</span>
          </Card>
        ))}
        <section className="flex min-w-0 flex-col gap-3 rounded-card border border-highlight bg-highlight p-5 text-highlight-ink">
          <span className="text-[13px] text-hoki-700">Próximo pago</span>
          {proximoPago ? (
            <>
              <span className="text-[22px] font-semibold">{fechaCorta(proximoPago.fecha)}</span>
              <span className="text-xs text-hoki-700">{proximoPago.alias}</span>
            </>
          ) : (
            <>
              <span className="text-[22px] font-semibold">—</span>
              <span className="text-xs text-hoki-700">Sin pagos en los próximos 30 días</span>
            </>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1180px]:grid-cols-2">
        <Card aria-labelledby="serie-titulo">
          <h2 className="m-0 text-base font-semibold" id="serie-titulo">
            Ingresos vs gastos · 6 meses
          </h2>
          <p className="m-0 text-sm text-faint">
            Sin datos todavía · Fuente: finanzas · Pendiente: serie mensual
          </p>
        </Card>

        <Card aria-labelledby="categorias-titulo">
          <h2 className="m-0 text-base font-semibold" id="categorias-titulo">
            Gastos por categoría
          </h2>
          {categorias.length === 0 ? (
            <p className="m-0 text-sm text-muted">
              No hay gastos por categoría en {moneda} para este periodo.
            </p>
          ) : (
            <ul
              aria-label={`Importes de gastos por categoría en ${moneda}`}
              className="m-0 flex list-none flex-col gap-3 p-0"
            >
              {categorias.map((fila, indice) => (
                <li
                  className="grid grid-cols-[110px_minmax(0,1fr)_72px] items-center gap-3 text-[13px]"
                  key={fila.categoria}
                >
                  <span className="truncate">{fila.categoria}</span>
                  <div aria-hidden="true" className="h-2.5 rounded-[5px] bg-surface-active">
                    <div
                      className={`h-full rounded-[5px] ${coloresBarra[indice % coloresBarra.length]}`}
                      style={{ width: `${mayor > 0 ? (fila.total / mayor) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-right font-mono">
                    {formatoMoneda[moneda].format(fila.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1180px]:grid-cols-2">
        <Card aria-labelledby="proximos-pagos-titulo">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold" id="proximos-pagos-titulo">
              Próximos pagos
            </h2>
            <Link className={enlaceClase} to="/finanzas/tarjetas">
              Ver tarjetas
            </Link>
          </div>
          {datos.eventos.length === 0 ? (
            <p className="m-0 text-sm text-muted">
              No hay cortes ni pagos en los próximos 30 días.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {datos.eventos.map((evento, indice) => (
                <li
                  className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider py-2.5 text-sm last:border-0"
                  key={`${evento.fecha}-${evento.tipo}-${evento.alias}-${indice}`}
                >
                  <span className="font-mono text-muted">{fechaCorta(evento.fecha)}</span>
                  <span className="truncate">
                    {evento.tipo === "PAGO" ? "Pago" : "Corte"} · {evento.alias}
                  </span>
                  <Tag suave={evento.tipo === "CORTE"}>
                    {evento.tipo === "PAGO" ? "pago" : "corte"}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="ultimos-titulo">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold" id="ultimos-titulo">
              Últimos movimientos
            </h2>
            <Link className={enlaceClase} to="/finanzas/gastos">
              Ver todos
            </Link>
          </div>
          {ultimos.length === 0 ? (
            <p className="m-0 text-sm text-muted">
              No hay movimientos en {moneda} para este periodo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <caption className="sr-only">Últimos movimientos en {moneda}</caption>
                <thead className="bg-surface">
                  <tr className="border-b border-divider text-muted">
                    <th className="px-3.5 py-2.5 font-medium" scope="col">fecha</th>
                    <th className="px-3.5 py-2.5 font-medium" scope="col">concepto</th>
                    <th className="px-3.5 py-2.5 font-medium" scope="col">origen</th>
                    <th className="px-3.5 py-2.5 text-right font-medium" scope="col">monto</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimos.map((movimiento) => (
                    <tr
                      className="border-b border-divider text-text-2 last:border-0"
                      key={movimiento.id}
                    >
                      <td className="whitespace-nowrap px-3.5 py-3 font-mono">
                        {fechaCorta(movimiento.fecha)}
                      </td>
                      <td className="px-3.5 py-3">{movimiento.comercio}</td>
                      <td className="px-3.5 py-3">
                        <Tag>{etiquetaOrigen(movimiento.origen)}</Tag>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 text-right font-mono">
                        {movimiento.tipo === "GASTO" ? "−" : "+"}
                        {formatoMoneda[movimiento.moneda].format(movimiento.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

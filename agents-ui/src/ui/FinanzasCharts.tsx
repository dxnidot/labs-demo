import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Moneda,
  ResumenCategoriaFinanciera,
  TipoMovimiento,
} from "../domain/MovimientoFinanciero";

const coloresGrafica = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
] as const;
const formatoNumerico = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});
const formatoMoneda: Record<Moneda, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }),
  USD: new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
  }),
};

interface FinanzasChartsProps {
  resumen: ResumenCategoriaFinanciera[];
  tipo: TipoMovimiento;
}

/**
 * Presenta los importes por categoría separados por tipo y moneda.
 * @author Daniel
 * @since 2026-09-30
 */
export function FinanzasCharts({ resumen, tipo }: FinanzasChartsProps) {
  const monedas: readonly Moneda[] = ["MXN", "USD"];
  const etiquetaTipo = tipo === "GASTO" ? "Gastos" : "Ingresos";

  return (
    <section aria-labelledby={`grafica-${tipo}`} className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold" id={`grafica-${tipo}`}>
        {etiquetaTipo} por categoría
      </h2>
      <div className="mt-4 space-y-6">
        {monedas.map((moneda) => {
          const categorias = resumen.filter(
            (item) => item.tipo === tipo && item.moneda === moneda,
          );
          if (categorias.length === 0) {
            return null;
          }
          const altura = Math.max(220, categorias.length * 44 + 48);

          return (
            <section
              aria-labelledby={`grafica-${tipo}-${moneda}`}
              className="border-t border-divider pt-4 first:border-0 first:pt-0"
              key={moneda}
            >
              <h3 className="mb-3 text-sm font-medium text-text-2" id={`grafica-${tipo}-${moneda}`}>
                {etiquetaTipo} · {moneda}
              </h3>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <ResponsiveContainer height={altura} minWidth={0} width="100%">
                    <BarChart
                      accessibilityLayer
                      aria-label={`${etiquetaTipo} por categoría en ${moneda}`}
                      data={categorias}
                      layout="vertical"
                      margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--color-divider)" />
                      <XAxis
                        axisLine={false}
                        tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                        tickFormatter={(value: number) => formatoNumerico.format(value)}
                        tickLine={false}
                        type="number"
                      />
                      <YAxis
                        axisLine={false}
                        dataKey="categoria"
                        tick={{ fill: "var(--color-text-2)", fontSize: 12 }}
                        tickLine={false}
                        type="category"
                        width={108}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-card)",
                          color: "var(--color-text)",
                        }}
                        formatter={(value) =>
                          formatoMoneda[moneda].format(
                            typeof value === "number" ? value : Number(value),
                          )
                        }
                      />
                      <Bar dataKey="total" name={moneda} radius={[0, 5, 5, 0]}>
                        {categorias.map((categoria, index) => (
                          <Cell
                            fill={coloresGrafica[index % coloresGrafica.length]}
                            key={`${categoria.categoria}-${index}`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul
                  aria-label={`Importes de ${etiquetaTipo.toLowerCase()} por categoría en ${moneda}`}
                  className="space-y-2 text-sm"
                >
                  {categorias.map((categoria, index) => (
                    <li
                      className="flex items-start justify-between gap-3"
                      key={`${categoria.categoria}-${index}`}
                    >
                      <span className="flex min-w-0 items-start gap-2 text-text-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-2 shrink-0 rounded-pill"
                          style={{ backgroundColor: coloresGrafica[index % coloresGrafica.length] }}
                        />
                        <span className="break-words">{categoria.categoria}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {formatoMoneda[moneda].format(categoria.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
        {!resumen.some((item) => item.tipo === tipo) && (
          <p className="rounded-button border border-border px-4 py-3 text-sm text-muted">
            No hay importes por categoría para este periodo.
          </p>
        )}
      </div>
    </section>
  );
}

import { lazy, Suspense, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  ObtenerResumenFinanciero,
  type ResumenFinanciero,
} from "../application/use-cases/ObtenerResumenFinanciero";
import type {
  Moneda,
  MovimientoFinanciero,
  TipoMovimiento,
} from "../domain/MovimientoFinanciero";
import { ApiHttpClient } from "../infrastructure/adapters/ApiHttpClient";
import { HttpFinanzasAdapter } from "../infrastructure/adapters/HttpFinanzasAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { Button } from "./components/Button";
import { FinanzasChatPanel } from "./FinanzasChatPanel";

const FinanzasCharts = lazy(() =>
  import("./FinanzasCharts").then((module) => ({ default: module.FinanzasCharts })),
);
const finanzasPort = new HttpFinanzasAdapter(new ApiHttpClient(keycloakAuthAdapter));
const obtenerResumenFinanciero = new ObtenerResumenFinanciero(finanzasPort);
const monedas: readonly Moneda[] = ["MXN", "USD"];
const periodoValido = /^\d{4}-\d{2}$/;
const formatoMoneda: Record<Moneda, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
  USD: new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }),
};
const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

/**
 * Presenta movimientos y tarjetas junto con el resumen mensual de finanzas.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Integra chat e importación CSV con confirmación.
 */
export function FinanzasPage() {
  const [periodo, setPeriodo] = useState(periodoActual);
  const [datos, setDatos] = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activa = true;
    setDatos(null);
    setCargando(true);
    setError(null);

    void obtenerResumenFinanciero
      .ejecutar(periodo)
      .then((resultado) => {
        if (activa) {
          setDatos(resultado);
        }
      })
      .catch((reason: unknown) => {
        if (activa) {
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar el resumen financiero.",
          );
        }
      })
      .finally(() => {
        if (activa) {
          setCargando(false);
        }
      });

    return () => {
      activa = false;
    };
  }, [periodo, recarga]);

  const movimientosDelPeriodo =
    datos?.movimientos.filter((movimiento) => movimiento.fecha.startsWith(periodo)) ?? [];
  const gastos = movimientosDelPeriodo.filter((movimiento) => movimiento.tipo === "GASTO");
  const ingresos = movimientosDelPeriodo.filter((movimiento) => movimiento.tipo === "INGRESO");

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[640px]:px-8 min-[640px]:py-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="mb-7 flex flex-col gap-4 min-[700px]:flex-row min-[700px]:items-end min-[700px]:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Finanzas</h1>
            <p className="mt-2 text-sm text-muted">
              Movimientos y resúmenes calculados por finanzas, por periodo y moneda.
            </p>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm text-text-2">
            <span>Periodo</span>
            <input
              aria-label="Periodo de consulta"
              className="min-h-11 rounded-button border border-border bg-surface px-3 text-text [color-scheme:dark]"
              onChange={(event) => {
                const nuevoPeriodo = event.currentTarget.value;
                if (periodoValido.test(nuevoPeriodo)) {
                  setPeriodo(nuevoPeriodo);
                }
              }}
              type="month"
              value={periodo}
            />
          </label>
        </header>

        <FinanzasChatPanel
          finanzas={finanzasPort}
          onImportConfirmed={() => setRecarga((actual) => actual + 1)}
        />

        {cargando && (
          <p className="mb-6 rounded-card border border-border bg-surface p-5 text-sm text-muted" role="status">
            Cargando movimientos, resumen y tarjetas…
          </p>
        )}
        {!cargando && error && (
          <div className="mb-6 flex flex-col gap-3 rounded-card border border-pink/30 bg-pill-pink p-5 min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between">
            <p className="text-sm text-pink" role="alert">{error}</p>
            <Button
              className="shrink-0"
              onClick={() => setRecarga((actual) => actual + 1)}
              variant="ghost"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Reintentar
            </Button>
          </div>
        )}

        {!cargando && datos && (
          <div className="space-y-8">
            <section aria-label="Resúmenes por categoría" className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-2">
              <Suspense fallback={<p className="text-sm text-muted" role="status">Cargando gráficas…</p>}>
                <FinanzasCharts resumen={datos.resumen} tipo="GASTO" />
                <FinanzasCharts resumen={datos.resumen} tipo="INGRESO" />
              </Suspense>
            </section>

            <section aria-labelledby="gastos-titulo">
              <h2 className="mb-4 text-lg font-semibold" id="gastos-titulo">Gastos</h2>
              <TablaMovimientos movimientos={gastos} tipo="GASTO" />
            </section>

            <section aria-labelledby="ingresos-titulo">
              <h2 className="mb-4 text-lg font-semibold" id="ingresos-titulo">Ingresos</h2>
              <TablaMovimientos movimientos={ingresos} tipo="INGRESO" />
            </section>

            <section aria-labelledby="tarjetas-titulo">
              <h2 className="mb-4 text-lg font-semibold" id="tarjetas-titulo">Tarjetas</h2>
              {datos.tarjetas.length === 0 ? (
                <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
                  No hay tarjetas registradas.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-card border border-border bg-surface">
                  <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
                    <caption className="sr-only">Tarjetas registradas</caption>
                    <thead className="text-muted">
                      <tr className="border-b border-divider">
                        <th className="px-4 py-3 font-medium" scope="col">Tarjeta</th>
                        <th className="px-4 py-3 font-medium" scope="col">Últimos 4</th>
                        <th className="px-4 py-3 font-medium" scope="col">Corte</th>
                        <th className="px-4 py-3 font-medium" scope="col">Pago</th>
                        <th className="px-4 py-3 font-medium" scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.tarjetas.map((tarjeta) => (
                        <tr className="border-b border-divider last:border-0" key={tarjeta.id}>
                          <th className="px-4 py-3 font-medium text-text-2" scope="row">{tarjeta.alias}</th>
                          <td className="px-4 py-3 font-mono text-text-2">•••• {tarjeta.ultimos4}</td>
                          <td className="px-4 py-3 text-text-2">Día {tarjeta.diaCorte}</td>
                          <td className="px-4 py-3 text-text-2">Día {tarjeta.diaPago}</td>
                          <td className="px-4 py-3 text-text-2">{tarjeta.activa ? "Activa" : "Inactiva"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
}

interface TablaMovimientosProps {
  movimientos: MovimientoFinanciero[];
  tipo: TipoMovimiento;
}

function TablaMovimientos({ movimientos, tipo }: TablaMovimientosProps) {
  if (movimientos.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
        No hay {tipo === "GASTO" ? "gastos" : "ingresos"} para este periodo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {monedas.map((moneda) => {
        const movimientosEnMoneda = movimientos.filter(
          (movimiento) => movimiento.moneda === moneda,
        );
        if (movimientosEnMoneda.length === 0) {
          return null;
        }
        const idTabla = `movimientos-${tipo}-${moneda.toLowerCase()}`;

        return (
          <section aria-labelledby={idTabla} key={moneda}>
            <h3 className="mb-3 text-sm font-medium text-text-2" id={idTabla}>
              {tipo === "GASTO" ? "Gastos" : "Ingresos"} · {moneda}
            </h3>
            <TablaMovimientosMoneda
              moneda={moneda}
              movimientos={movimientosEnMoneda}
              tipo={tipo}
            />
          </section>
        );
      })}
    </div>
  );
}

interface TablaMovimientosMonedaProps {
  moneda: Moneda;
  movimientos: MovimientoFinanciero[];
  tipo: TipoMovimiento;
}

function TablaMovimientosMoneda({
  moneda,
  movimientos,
  tipo,
}: TablaMovimientosMonedaProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
        <caption className="sr-only">
          {tipo === "GASTO" ? "Gastos" : "Ingresos"} del periodo en {moneda}
        </caption>
        <thead className="text-muted">
          <tr className="border-b border-divider">
            <th className="px-4 py-3 font-medium" scope="col">Fecha</th>
            <th className="px-4 py-3 font-medium" scope="col">Comercio</th>
            <th className="px-4 py-3 font-medium" scope="col">Categoría</th>
            <th className="px-4 py-3 font-medium" scope="col">Origen</th>
            <th className="px-4 py-3 text-right font-medium" scope="col">Importe</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => (
            <tr className="border-b border-divider last:border-0" key={movimiento.id}>
              <td className="px-4 py-3 text-text-2">
                {formatoFecha.format(new Date(`${movimiento.fecha}T00:00:00.000Z`))}
              </td>
              <th className="max-w-[260px] truncate px-4 py-3 font-medium text-text-2" scope="row">
                {movimiento.comercio}
              </th>
              <td className="px-4 py-3 text-text-2">{movimiento.categoria}</td>
              <td className="px-4 py-3 text-text-2">{etiquetaOrigen(movimiento)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-2">
                {formatoMoneda[movimiento.moneda].format(movimiento.monto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function etiquetaOrigen(movimiento: MovimientoFinanciero): string {
  switch (movimiento.origen) {
    case "IMPORT":
      return "Importación";
    case "MANUAL":
      return "Manual";
    case "NOTIFICACION":
      return "Notificación";
  }
}

function periodoActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

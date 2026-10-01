import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import {
  ObtenerResumenFinanciero,
  type ResumenFinanciero,
} from "../application/use-cases/ObtenerResumenFinanciero";
import type { Moneda } from "../domain/MovimientoFinanciero";
import type { Tarjeta } from "../domain/Tarjeta";
import { ApiHttpClient } from "../infrastructure/adapters/ApiHttpClient";
import { HttpFinanzasAdapter } from "../infrastructure/adapters/HttpFinanzasAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { Button } from "./components/Button";
import { claseFoco } from "./components/foco";
import { FinanzasChatPanel } from "./FinanzasChatPanel";
import { fechaLocalActual, periodoActual } from "./finanzasFormato";
import { FinanzasMovimientosTab } from "./FinanzasMovimientosTab";
import { FinanzasResumenTab } from "./FinanzasResumenTab";
import { FinanzasTarjetasTab } from "./FinanzasTarjetasTab";
import { FinanzasTradingTab } from "./FinanzasTradingTab";
import { useVistaEstrecha } from "./useVistaEstrecha";

const finanzasPort = new HttpFinanzasAdapter(new ApiHttpClient(keycloakAuthAdapter));
const obtenerResumenFinanciero = new ObtenerResumenFinanciero(finanzasPort);
const monedas: readonly Moneda[] = ["MXN", "USD"];
const periodoValido = /^\d{4}-\d{2}$/;
const idBotonAsistente = "abrir-asistente-finanzas";
const idPanelPestanas = "panel-finanzas";

function idPestana(id: string): string {
  return `pestana-finanzas-${id}`;
}

const pestanas = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "gastos", etiqueta: "Gastos" },
  { id: "ingresos", etiqueta: "Ingresos" },
  { id: "tarjetas", etiqueta: "Tarjetas y pagos" },
  { id: "trading-mx", etiqueta: "Trading MX" },
  { id: "trading-usa", etiqueta: "Trading USA" },
] as const;

type PestanaId = (typeof pestanas)[number]["id"];

function esPestana(valor: string | undefined): valor is PestanaId {
  return pestanas.some((pestana) => pestana.id === valor);
}

/**
 * Vista de Finanzas: encabezado, pestañas por ruta y panel del asistente plegable.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Integra chat e importación CSV con confirmación.
 * @modified Daniel Tovar 2026-09-30 Rediseño con pestañas como rutas, alternador de moneda y panel derecho.
 * @modified Daniel Tovar 2026-09-30 ARIA completo de pestañas, foco visible y retorno de foco del asistente.
 */
export function FinanzasPage() {
  const { tab } = useParams();
  const estrecha = useVistaEstrecha();
  const [periodo, setPeriodo] = useState(periodoActual);
  const [moneda, setMoneda] = useState<Moneda>("MXN");
  const [datos, setDatos] = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asistenteAbierto, setAsistenteAbierto] = useState(!estrecha);

  const panelAsistente = useRef<HTMLDivElement | null>(null);
  const destinoFoco = useRef<"boton" | "panel" | null>(null);

  useEffect(() => {
    setAsistenteAbierto(!estrecha);
  }, [estrecha]);

  useEffect(() => {
    const destino = destinoFoco.current;
    destinoFoco.current = null;
    if (destino === "panel") {
      panelAsistente.current?.focus();
    } else if (destino === "boton") {
      document.getElementById(idBotonAsistente)?.focus();
    }
  }, [asistenteAbierto]);

  const abrirAsistente = useCallback(() => {
    destinoFoco.current = "panel";
    setAsistenteAbierto(true);
  }, []);

  const cerrarAsistente = useCallback(() => {
    destinoFoco.current = "boton";
    setAsistenteAbierto(false);
  }, []);

  const peticion = useRef(0);
  const cargar = useCallback(async (periodoConsulta: string, silencioso: boolean) => {
    const actual = ++peticion.current;
    if (!silencioso) {
      setDatos(null);
      setCargando(true);
    }
    setError(null);
    try {
      const resultado = await obtenerResumenFinanciero.ejecutar(
        periodoConsulta,
        fechaLocalActual(),
      );
      if (actual === peticion.current) {
        setDatos(resultado);
      }
    } catch (reason: unknown) {
      if (actual === peticion.current) {
        setError(
          reason instanceof Error ? reason.message : "No se pudo cargar el resumen financiero.",
        );
      }
    } finally {
      if (actual === peticion.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    void cargar(periodo, false);
  }, [cargar, periodo]);

  if (!esPestana(tab)) {
    return <Navigate replace to="/finanzas/resumen" />;
  }

  function alActualizarTarjeta(actualizada: Tarjeta) {
    setDatos((actual) =>
      actual
        ? {
            ...actual,
            tarjetas: actual.tarjetas.map((tarjeta) =>
              tarjeta.id === actualizada.id ? actualizada : tarjeta,
            ),
          }
        : actual,
    );
    void cargar(periodo, true);
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto px-8 py-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[26px] font-semibold">Finanzas</h1>
            <p className="m-0 text-sm text-muted">
              Calculado por el servicio finanzas · solo en tu PC.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="periodo-finanzas">Periodo</label>
            <input
              className="min-h-8 rounded-pill border border-border bg-transparent px-3 text-[13px] text-text-2 scheme-dark"
              id="periodo-finanzas"
              onChange={(event) => {
                const nuevoPeriodo = event.currentTarget.value;
                if (periodoValido.test(nuevoPeriodo)) {
                  setPeriodo(nuevoPeriodo);
                }
              }}
              type="month"
              value={periodo}
            />
            <div
              aria-label="Moneda"
              className="inline-flex rounded-pill border border-border p-0.75"
              role="group"
            >
              {monedas.map((opcion) => (
                <button
                  aria-pressed={moneda === opcion}
                  className={`min-h-7.5 rounded-pill px-3 font-mono text-xs ${claseFoco} ${
                    moneda === opcion ? "bg-accent text-accent-ink" : "text-muted"
                  }`}
                  key={opcion}
                  onClick={() => setMoneda(opcion)}
                  type="button"
                >
                  {opcion}
                </button>
              ))}
            </div>
            {!asistenteAbierto && (
              <Button
                className={claseFoco}
                id={idBotonAsistente}
                onClick={abrirAsistente}
                variant="primary"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Asistente
              </Button>
            )}
          </div>
        </header>

        <div
          aria-label="Secciones de finanzas"
          className="flex gap-1 overflow-x-auto border-b border-border pb-0.5"
          role="tablist"
        >
          {pestanas.map((pestana) => (
            <Link
              aria-controls={idPanelPestanas}
              aria-selected={pestana.id === tab}
              className={`inline-flex min-h-10 items-center whitespace-nowrap border-b-2 px-3.5 text-sm hover:text-text ${claseFoco} ${
                pestana.id === tab ? "border-accent text-text" : "border-transparent text-muted"
              }`}
              id={idPestana(pestana.id)}
              key={pestana.id}
              role="tab"
              to={`/finanzas/${pestana.id}`}
            >
              {pestana.etiqueta}
            </Link>
          ))}
        </div>

        <div aria-labelledby={idPestana(tab)} id={idPanelPestanas} role="tabpanel">
          {cargando && (
            <p className="m-0 rounded-card border border-border bg-surface p-5 text-sm text-muted" role="status">
              Cargando movimientos, resumen y tarjetas…
            </p>
          )}
          {!cargando && error && (
            <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-active p-5 min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between">
              <p className="m-0 text-sm text-danger" role="alert">{error}</p>
              <Button
                className={`shrink-0 ${claseFoco}`}
                onClick={() => void cargar(periodo, false)}
                variant="ghost"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Reintentar
              </Button>
            </div>
          )}
          {datos && tab === "resumen" && (
            <FinanzasResumenTab datos={datos} moneda={moneda} periodo={periodo} />
          )}
          {datos && tab === "gastos" && (
            <FinanzasMovimientosTab
              moneda={moneda}
              movimientos={datos.movimientos}
              periodo={periodo}
              tarjetas={datos.tarjetas}
              tipo="GASTO"
            />
          )}
          {datos && tab === "ingresos" && (
            <FinanzasMovimientosTab
              moneda={moneda}
              movimientos={datos.movimientos}
              periodo={periodo}
              tarjetas={datos.tarjetas}
              tipo="INGRESO"
            />
          )}
          {datos && tab === "tarjetas" && (
            <FinanzasTarjetasTab
              eventos={datos.eventos}
              finanzas={finanzasPort}
              onTarjetaActualizada={alActualizarTarjeta}
              tarjetas={datos.tarjetas}
            />
          )}
          {datos && tab === "trading-mx" && <FinanzasTradingTab mercado="mx" />}
          {datos && tab === "trading-usa" && <FinanzasTradingTab mercado="usa" />}
        </div>
      </div>

      <FinanzasChatPanel
        abierto={asistenteAbierto}
        drawer={estrecha}
        finanzas={finanzasPort}
        panelRef={panelAsistente}
        onCerrar={cerrarAsistente}
        onImportConfirmed={() => void cargar(periodo, true)}
      />
    </div>
  );
}

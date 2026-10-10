import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpLeft,
  CreditCard,
  LayoutGrid,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import {
  ObtenerResumenFinanciero,
  type ResumenFinanciero,
} from "../application/use-cases/ObtenerResumenFinanciero";
import type { Moneda } from "../domain/MovimientoFinanciero";
import type { Tarjeta } from "../domain/Tarjeta";
import { adaptadores } from "../infrastructure/composition";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { AvisoCarga, Esqueleto, EsqueletoTabla } from "./components/Esqueleto";
import { EstadoError } from "./components/EstadoError";
import { claseFocoInterno } from "./components/foco";
import { PageLayout } from "./components/PageLayout";
import { SelectorPeriodo } from "./components/SelectorPeriodo";
import { FinanzasChatPanel } from "./FinanzasChatPanel";
import { fechaLocalActual, periodoActual, textoActualizado } from "./finanzasFormato";
import { pestanasFinanzas } from "./finanzasPestanas";
import { FinanzasMovimientosTab } from "./FinanzasMovimientosTab";
import { FinanzasResumenTab } from "./FinanzasResumenTab";
import { FinanzasTarjetasTab } from "./FinanzasTarjetasTab";
import { FinanzasInversionesTab } from "./FinanzasInversionesTab";
import { alPulsarTeclaEnPestanas } from "./pestanasTeclado";
import { useMinutosDesde } from "./useMinutosDesde";
import { useScrollPestanaActiva } from "./useScrollPestanaActiva";
import { useVistaEstrecha } from "./useVistaEstrecha";

const finanzasPort = adaptadores.finanzas;
const obtenerResumenFinanciero = new ObtenerResumenFinanciero(finanzasPort);
const monedas: readonly Moneda[] = ["MXN", "USD"];
const iconosPestana: Record<(typeof pestanasFinanzas)[number]["id"], typeof LayoutGrid> = {
  resumen: LayoutGrid,
  gastos: ArrowDownRight,
  ingresos: ArrowUpLeft,
  tarjetas: CreditCard,
  inversiones: TrendingUp,
};
const idBotonAsistente = "abrir-asistente-finanzas";
const idPanelPestanas = "panel-finanzas";

function idPestana(id: string): string {
  return `pestana-finanzas-${id}`;
}

type PestanaId = (typeof pestanasFinanzas)[number]["id"];

function esPestana(valor: string | undefined): valor is PestanaId {
  return pestanasFinanzas.some((pestana) => pestana.id === valor);
}

/**
 * Vista de Finanzas: encabezado, pestañas por ruta y panel del asistente plegable.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Integra chat e importación CSV con confirmación.
 * @modified Daniel Tovar 2026-09-30 Rediseño con pestañas como rutas, alternador de moneda y panel derecho.
 * @modified Daniel Tovar 2026-09-30 ARIA completo de pestañas, foco visible y retorno de foco del asistente.
 * @modified Daniel Tovar 2026-09-30 La pestaña activa lleva solo la línea inferior (.ftab de la maqueta).
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (pestañas fijas, único scroll), botón Asistente siempre visible en angosto y pestañas con scroll.
 * @modified Daniel Tovar 2026-10-10 Pestañas con flechas y tabindex itinerante, MXN/USD de 44px en angosto y lista de pestañas compartida.
 * @modified Daniel Tovar 2026-10-10 Adaptador de finanzas desde el composition root (VITE_USE_MOCKS).
 * @modified Daniel Tovar 2026-10-10 Esqueleto de carga y error con el componente común.
 * @modified Daniel Tovar 2026-10-10 Mockups 12 y 14: pestaña Inversiones, íconos, periodo con flechas, "Actualizado hace…" y columna de ~1180px.
 */
export function FinanzasPage() {
  const { tab } = useParams();
  const estrecha = useVistaEstrecha();
  const listaPestanas = useScrollPestanaActiva(tab ?? "");
  const [periodo, setPeriodo] = useState(periodoActual);
  const [moneda, setMoneda] = useState<Moneda>("MXN");
  const [datos, setDatos] = useState<ResumenFinanciero | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);
  const minutos = useMinutosDesde(actualizadoEn);
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
        setActualizadoEn(new Date());
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

  const acciones = (
    <div className="flex flex-wrap items-center gap-2">
      <SelectorPeriodo onCambiar={setPeriodo} periodo={periodo} />
      <div
        aria-label="Moneda"
        className="inline-flex rounded-pill border border-border p-0.75"
        role="group"
      >
        {monedas.map((opcion) => (
          <button
            aria-pressed={moneda === opcion}
            className={`min-h-11 min-w-11 rounded-pill px-3 font-mono text-xs shell:min-h-7.5 shell:min-w-0 ${claseFocoInterno} ${
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
      {(estrecha || !asistenteAbierto) && (
        <Button
          id={idBotonAsistente}
          onClick={abrirAsistente}
          variant="primary"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Asistente
        </Button>
      )}
    </div>
  );

  const pestanasNav = (
    <div
      aria-label="Secciones de finanzas"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border"
      onKeyDown={alPulsarTeclaEnPestanas}
      ref={listaPestanas}
      role="tablist"
    >
      {pestanasFinanzas.map((pestana) => {
        const Icono = iconosPestana[pestana.id];
        const activa = pestana.id === tab;
        return (
          <Link
            aria-controls={idPanelPestanas}
            aria-selected={activa}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-none border-b-2 bg-transparent px-3.5 text-sm hover:text-text shell:min-h-10 ${claseFocoInterno} ${
              activa ? "border-accent font-semibold text-text" : "border-transparent font-medium text-muted"
            }`}
            id={idPestana(pestana.id)}
            key={pestana.id}
            role="tab"
            tabIndex={activa ? 0 : -1}
            to={`/finanzas/${pestana.id}`}
          >
            <Icono aria-hidden="true" className="size-4 shrink-0" />
            {pestana.etiqueta}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <PageLayout
        acciones={acciones}
        anchoColumna
        pestanas={pestanasNav}
        subtitulo={textoActualizado(minutos)}
        titulo="Finanzas"
      >
        <div aria-labelledby={idPestana(tab)} id={idPanelPestanas} role="tabpanel">
          {cargando && (
            <>
              <AvisoCarga texto="Cargando movimientos, resumen y tarjetas…" />
              <div aria-hidden="true" className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 wide:grid-cols-4">
                  {Array.from({ length: 4 }, (_, indice) => (
                    <Card key={indice}>
                      <Esqueleto className="h-4 w-1/2" />
                      <Esqueleto className="h-7 w-3/4" />
                    </Card>
                  ))}
                </div>
                <EsqueletoTabla />
              </div>
            </>
          )}
          {!cargando && error && (
            <EstadoError mensaje={error} onReintentar={() => void cargar(periodo, false)} />
          )}
          {datos && tab === "resumen" && (
            <FinanzasResumenTab datos={datos} hoy={fechaLocalActual()} moneda={moneda} periodo={periodo} />
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
              hoy={fechaLocalActual()}
              onTarjetaActualizada={alActualizarTarjeta}
              tarjetas={datos.tarjetas}
            />
          )}
          {datos && tab === "inversiones" && <FinanzasInversionesTab />}
        </div>
      </PageLayout>

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

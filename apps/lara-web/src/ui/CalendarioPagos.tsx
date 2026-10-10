import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { AvisoCarga, Esqueleto } from "./components/Esqueleto";
import { EstadoError } from "./components/EstadoError";
import { claseFocoInterno } from "./components/foco";
import { Tag } from "./components/Tag";
import {
  diasDelPeriodo,
  diasEntre,
  enmascarar,
  etiquetaPeriodo,
  fechaConDiaSemana,
  fechaLarga,
  moverPeriodo,
  textoEnDias,
} from "./finanzasFormato";

interface CalendarioPagosProps {
  finanzas: FinanzasPort;
  tarjetas: Tarjeta[];
  /** Fecha de hoy AAAA-MM-DD. */
  hoy: string;
  /** Día que se muestra seleccionado al abrir (normalmente el próximo pago); por defecto, hoy. */
  fechaInicial?: string;
}

export const idCalendarioPagos = "calendario-pagos";

const diasSemana = [
  ["L", "lunes"],
  ["M", "martes"],
  ["M", "miércoles"],
  ["J", "jueves"],
  ["V", "viernes"],
  ["S", "sábado"],
  ["D", "domingo"],
] as const;

function dos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function aUtc(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(aUtc(fecha).getTime() + dias * 86_400_000);
  return `${resultado.getUTCFullYear()}-${dos(resultado.getUTCMonth() + 1)}-${dos(resultado.getUTCDate())}`;
}

/** Posición del día en la semana con lunes primero (0 = lunes … 6 = domingo). */
function columnaSemana(fecha: string): number {
  return (aUtc(fecha).getUTCDay() + 6) % 7;
}

function etiquetaDia(fecha: string, delDia: EventoCalendario[]): string {
  const pagos = delDia.filter((evento) => evento.tipo === "PAGO").length;
  const cortes = delDia.length - pagos;
  const partes = [
    pagos > 0 ? `${pagos} ${pagos === 1 ? "pago" : "pagos"}` : "",
    cortes > 0 ? `${cortes} ${cortes === 1 ? "corte" : "cortes"}` : "",
  ].filter(Boolean);
  return partes.length > 0 ? `${fechaLarga(fecha)}, ${partes.join(" y ")}` : fechaLarga(fecha);
}

function Marcador({ tipo }: { tipo: "PAGO" | "CORTE" }) {
  return (
    <span
      aria-hidden="true"
      className={`size-1.75 rounded-full ${tipo === "PAGO" ? "bg-highlight" : "border-2 border-faint"}`}
    />
  );
}

/**
 * Calendario del mes en cuadrícula de 7 columnas: ● pago y ○ corte por día; el día se selecciona con el clic o
 * con el teclado (flechas, Inicio, Fin, RePág y AvPág) y su detalle aparece debajo. Solo muestra tarjetas activas.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function CalendarioPagos({ finanzas, tarjetas, hoy, fechaInicial }: CalendarioPagosProps) {
  const inicial = fechaInicial ?? hoy;
  const [mes, setMes] = useState(inicial.slice(0, 7));
  const [seleccion, setSeleccion] = useState(inicial);
  const [eventos, setEventos] = useState<EventoCalendario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const celdas = useRef(new Map<string, HTMLDivElement>());
  const enfocarSeleccion = useRef(false);

  useEffect(() => {
    let activo = true;
    setEventos(null);
    setError(null);
    finanzas
      .consultarCalendario(`${mes}-01`, diasDelPeriodo(mes))
      .then((lista) => {
        if (activo) {
          setEventos(lista.filter((evento) => evento.fecha.startsWith(mes)));
        }
      })
      .catch((reason: unknown) => {
        if (activo) {
          setError(reason instanceof Error ? reason.message : "No se pudo cargar el calendario.");
        }
      });
    return () => {
      activo = false;
    };
  }, [finanzas, mes, tarjetas, intento]);

  useEffect(() => {
    if (enfocarSeleccion.current) {
      enfocarSeleccion.current = false;
      celdas.current.get(seleccion)?.focus();
    }
  }, [seleccion, eventos]);

  const totalDias = diasDelPeriodo(mes);
  const dias = useMemo(
    () => Array.from({ length: totalDias }, (_, indice) => `${mes}-${dos(indice + 1)}`),
    [mes, totalDias],
  );
  const semanas = useMemo(() => {
    const huecos: Array<string | null> = Array.from({ length: columnaSemana(`${mes}-01`) }, () => null);
    const celdasMes = [...huecos, ...dias];
    while (celdasMes.length % 7 !== 0) {
      celdasMes.push(null);
    }
    return Array.from({ length: celdasMes.length / 7 }, (_, fila) => celdasMes.slice(fila * 7, fila * 7 + 7));
  }, [mes, dias]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    for (const evento of eventos ?? []) {
      mapa.set(evento.fecha, [...(mapa.get(evento.fecha) ?? []), evento]);
    }
    return mapa;
  }, [eventos]);

  function irAMes(nuevoMes: string, conFoco = false) {
    const dia = Math.min(Number(seleccion.slice(8)), diasDelPeriodo(nuevoMes));
    enfocarSeleccion.current = conFoco;
    setMes(nuevoMes);
    setSeleccion(`${nuevoMes}-${dos(dia)}`);
  }

  function alPulsarTecla(event: KeyboardEvent<HTMLDivElement>) {
    const columna = columnaSemana(seleccion);
    const movimientos: Record<string, string> = {
      ArrowLeft: sumarDias(seleccion, -1),
      ArrowRight: sumarDias(seleccion, 1),
      ArrowUp: sumarDias(seleccion, -7),
      ArrowDown: sumarDias(seleccion, 7),
      Home: sumarDias(seleccion, -columna),
      End: sumarDias(seleccion, 6 - columna),
    };
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      irAMes(moverPeriodo(mes, event.key === "PageUp" ? -1 : 1), true);
      return;
    }
    const destino = movimientos[event.key];
    if (destino === undefined) {
      return;
    }
    event.preventDefault();
    const limitado = destino.startsWith(mes) ? destino : destino < `${mes}-01` ? `${mes}-01` : `${mes}-${dos(totalDias)}`;
    enfocarSeleccion.current = true;
    setSeleccion(limitado);
  }

  const delDiaSeleccionado = porDia.get(seleccion) ?? [];
  const botonMes =
    "inline-flex size-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-hover hover:text-text shell:size-8 " +
    claseFocoInterno;

  return (
    <section
      aria-labelledby="titulo-calendario"
      className="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface p-5 outline-none"
      id={idCalendarioPagos}
      tabIndex={-1}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            aria-label="Mes anterior del calendario"
            className={botonMes}
            onClick={() => irAMes(moverPeriodo(mes, -1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <h2 className="m-0 min-w-36 text-center text-base font-semibold" id="titulo-calendario">
            {etiquetaPeriodo(mes)}
          </h2>
          <button
            aria-label="Mes siguiente del calendario"
            className={botonMes}
            onClick={() => irAMes(moverPeriodo(mes, 1))}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
        <ul aria-label="Leyenda" className="m-0 flex list-none gap-3.5 p-0 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <Marcador tipo="PAGO" />
            pago
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Marcador tipo="CORTE" />
            corte
          </li>
        </ul>
      </div>

      {eventos === null && !error && (
        <>
          <AvisoCarga texto="Cargando el calendario…" />
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Esqueleto className="h-5 w-full" />
            <Esqueleto className="h-40 w-full" />
          </div>
        </>
      )}
      {error && <EstadoError mensaje={error} onReintentar={() => setIntento((actual) => actual + 1)} />}

      {eventos !== null && (
        <div
          aria-label={etiquetaPeriodo(mes)}
          className="flex flex-col gap-1.5"
          onKeyDown={alPulsarTecla}
          role="grid"
        >
          <div className="grid grid-cols-7 gap-1.5" role="row">
            {diasSemana.map(([letra, nombre]) => (
              <span
                aria-label={nombre}
                className="pb-1 text-center text-label text-faint"
                key={nombre}
                role="columnheader"
              >
                {letra}
              </span>
            ))}
          </div>
          {semanas.map((semana, fila) => (
            <div className="grid grid-cols-7 gap-1.5" key={fila} role="row">
              {semana.map((fecha, columna) => {
                if (!fecha) {
                  return <div aria-hidden="true" key={`hueco-${fila}-${columna}`} role="gridcell" />;
                }
                const delDia = porDia.get(fecha) ?? [];
                const elegido = fecha === seleccion;
                return (
                  <div
                    aria-label={etiquetaDia(fecha, delDia)}
                    aria-selected={elegido}
                    className={`num flex min-h-13 cursor-pointer flex-col items-center gap-1 rounded-button py-2 text-text-2 outline-none transition-colors hover:bg-surface-hover ${claseFocoInterno} ${
                      elegido ? "bg-surface-active ring-1 ring-inset ring-accent" : ""
                    }`}
                    key={fecha}
                    onClick={() => setSeleccion(fecha)}
                    ref={(nodo) => {
                      if (nodo) {
                        celdas.current.set(fecha, nodo);
                      } else {
                        celdas.current.delete(fecha);
                      }
                    }}
                    role="gridcell"
                    tabIndex={elegido ? 0 : -1}
                  >
                    <span className="text-sm font-medium">{Number(fecha.slice(8))}</span>
                    <span className="flex h-1.75 items-center gap-1">
                      {delDia.some((evento) => evento.tipo === "PAGO") && <Marcador tipo="PAGO" />}
                      {delDia.some((evento) => evento.tipo === "CORTE") && <Marcador tipo="CORTE" />}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div aria-live="polite" className="flex flex-col gap-2 border-t border-border pt-2.5">
        <span className="num pt-2.5 text-xs uppercase tracking-wide text-faint">{fechaConDiaSemana(seleccion)}</span>
        {delDiaSeleccionado.length === 0 ? (
          <p className="m-0 text-sm text-muted">Sin pagos ni cortes este día.</p>
        ) : (
          <ul aria-label="Eventos del día" className="m-0 flex list-none flex-col gap-2 p-0">
            {delDiaSeleccionado.map((evento) => {
              const tarjeta = tarjetas.find((candidata) => candidata.alias === evento.alias);
              const dias = diasEntre(hoy, evento.fecha);
              return (
                <li
                  className="flex flex-wrap items-center gap-2.5 text-sm"
                  key={`${evento.tipo}-${evento.alias}`}
                >
                  <Tag suave={evento.tipo === "CORTE"}>{evento.tipo === "PAGO" ? "pago" : "corte"}</Tag>
                  <span>
                    {evento.alias}
                    {tarjeta && <span className="ml-2 font-mono text-muted">{enmascarar(tarjeta.ultimos4)}</span>}
                  </span>
                  {dias >= 0 && <span className="num text-xs text-faint">{textoEnDias(dias)}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="m-0 text-xs text-faint">
        Toca un día para ver sus eventos. Las tarjetas inactivas no aparecen. Fines de semana y feriados: regla pendiente.
      </p>
    </section>
  );
}

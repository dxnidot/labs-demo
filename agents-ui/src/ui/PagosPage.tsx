import { useEffect, useState } from "react";
import { CalendarDays, CreditCard } from "lucide-react";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { AlternarEstadoTarjeta } from "../application/use-cases/AlternarEstadoTarjeta";
import { ObtenerPagos } from "../application/use-cases/ObtenerPagos";
import { ApiHttpClient } from "../infrastructure/adapters/ApiHttpClient";
import { HttpFinanzasAdapter } from "../infrastructure/adapters/HttpFinanzasAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { Button } from "./components/Button";

const finanzasPort = new HttpFinanzasAdapter(
  new ApiHttpClient(keycloakAuthAdapter),
);
const obtenerPagos = new ObtenerPagos(finanzasPort);
const alternarEstadoTarjeta = new AlternarEstadoTarjeta(finanzasPort);
const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
});

/**
 * Presenta tarjetas y los eventos del calendario calculados por finanzas.
 * @author Daniel
 * @since 2026-09-30
 */
export function PagosPage() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null);
  const [eventos, setEventos] = useState<EventoCalendario[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tarjetasActualizando, setTarjetasActualizando] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let active = true;
    void obtenerPagos
      .ejecutar(fechaLocalActual())
      .then((pagos) => {
        if (active) {
          setTarjetas(pagos.tarjetas);
          setEventos(pagos.eventos);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudieron cargar las tarjetas y el calendario.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setCargando(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function cambiarEstado(tarjeta: Tarjeta) {
    setError(null);
    setTarjetasActualizando((actualizando) => new Set(actualizando).add(tarjeta.id));
    try {
      const actualizada = await alternarEstadoTarjeta.ejecutar(tarjeta);
      setTarjetas((actuales) =>
        actuales?.map((actual) => (actual.id === actualizada.id ? actualizada : actual)) ??
        null,
      );
      try {
        const pagos = await obtenerPagos.ejecutar(fechaLocalActual());
        setTarjetas(pagos.tarjetas);
        setEventos(pagos.eventos);
      } catch {
        setError("La tarjeta se actualizó, pero no se pudo actualizar el calendario.");
      }
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : `No se pudo actualizar la tarjeta ${tarjeta.alias}.`,
      );
    } finally {
      setTarjetasActualizando((actualizando) => {
        const siguientes = new Set(actualizando);
        siguientes.delete(tarjeta.id);
        return siguientes;
      });
    }
  }

  const eventosPorFecha = agruparEventos(eventos ?? []);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[640px]:px-8 min-[640px]:py-8">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="mb-7">
          <h1 className="text-2xl font-semibold">Pagos</h1>
          <p className="mt-2 text-sm text-muted">
            Cortes y pagos de tarjetas para los próximos 30 días.
          </p>
        </header>

        {error && (
          <p className="mb-6 rounded-card border border-pink/30 bg-pill-pink px-4 py-3 text-sm text-pink" role="alert">
            {error}
          </p>
        )}

        <section aria-labelledby="calendario-titulo" className="mb-8">
          <h2 id="calendario-titulo" className="mb-4 flex items-center gap-2 text-lg font-medium">
            <CalendarDays aria-hidden="true" className="size-5 text-accent" />
            Próximos 30 días
          </h2>
          {cargando && <p className="text-sm text-muted" role="status">Cargando calendario…</p>}
          {!cargando && eventos !== null && eventos.length === 0 && (
            <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
              No hay cortes ni pagos programados en los próximos 30 días.
            </p>
          )}
          {!cargando && eventosPorFecha.length > 0 && (
            <ol className="space-y-3">
              {eventosPorFecha.map(([fecha, eventosDelDia]) => (
                <li
                  className="rounded-card border border-border bg-surface p-4 min-[640px]:p-5"
                  key={fecha}
                >
                  <h3 className="mb-3 text-sm font-semibold capitalize text-text-2">
                    {formatoFecha.format(new Date(`${fecha}T00:00:00.000Z`))}
                  </h3>
                  <ul className="space-y-2">
                    {eventosDelDia.map((evento, index) => (
                      <li className="flex items-center gap-3 text-sm" key={`${evento.tipo}-${evento.alias}-${index}`}>
                        <span
                          aria-hidden="true"
                          className={`size-2 shrink-0 rounded-pill ${evento.tipo === "PAGO" ? "bg-accent" : "bg-faint"}`}
                        />
                        <span className="text-muted">
                          {evento.tipo === "PAGO" ? "Pago" : "Corte"}
                        </span>
                        <span className="min-w-0 truncate">{evento.alias}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="tarjetas-titulo">
          <h2 id="tarjetas-titulo" className="mb-4 flex items-center gap-2 text-lg font-medium">
            <CreditCard aria-hidden="true" className="size-5 text-accent" />
            Tarjetas
          </h2>
          {cargando && <p className="text-sm text-muted" role="status">Cargando tarjetas…</p>}
          {!cargando && tarjetas?.length === 0 && (
            <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
              Aún no tienes tarjetas. Cárgalas desde el chat de Finanzas.
            </p>
          )}
          {!cargando && tarjetas && tarjetas.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
              {tarjetas.map((tarjeta) => (
                <li key={tarjeta.id}>
                  <article className="h-full rounded-card border border-border bg-surface p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold">{tarjeta.alias}</h3>
                        <p className="mt-1 font-mono text-sm text-muted">
                          •••• {tarjeta.ultimos4}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-pill bg-surface-active px-3 py-1 text-xs text-text-2">
                        {tarjeta.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                      <div>
                        <dt className="text-muted">Corte</dt>
                        <dd className="mt-1">Día {tarjeta.diaCorte}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Pago</dt>
                        <dd className="mt-1">Día {tarjeta.diaPago}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted">MSI anticipado</dt>
                        <dd className="mt-1">
                          {tarjeta.permiteLiquidarMsiAnticipado ? "Permitido" : "No permitido"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 border-t border-divider pt-4">
                      <Button
                        aria-label={`${tarjeta.activa ? "Desactivar" : "Activar"} ${tarjeta.alias}`}
                        disabled={tarjetasActualizando.has(tarjeta.id)}
                        onClick={() => void cambiarEstado(tarjeta)}
                      >
                        {tarjetasActualizando.has(tarjeta.id)
                          ? "Actualizando…"
                          : tarjeta.activa
                            ? "Desactivar"
                            : "Activar"}
                      </Button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function fechaLocalActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function agruparEventos(
  eventos: EventoCalendario[],
): Array<[string, EventoCalendario[]]> {
  const grupos = new Map<string, EventoCalendario[]>();
  for (const evento of eventos) {
    const grupo = grupos.get(evento.fecha);
    if (grupo) {
      grupo.push(evento);
    } else {
      grupos.set(evento.fecha, [evento]);
    }
  }
  return Array.from(grupos.entries());
}

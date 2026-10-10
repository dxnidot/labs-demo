import { useState } from "react";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import { AlternarEstadoTarjeta } from "../application/use-cases/AlternarEstadoTarjeta";
import { Card } from "./components/Card";
import { Tag } from "./components/Tag";
import { claseFocoInterno } from "./components/foco";
import { enmascarar, fechaConDiaSemana } from "./finanzasFormato";

interface FinanzasTarjetasTabProps {
  eventos: EventoCalendario[];
  finanzas: FinanzasPort;
  onTarjetaActualizada: (tarjeta: Tarjeta) => void;
  tarjetas: Tarjeta[];
}

/**
 * Tabla de tarjetas con interruptor de activa y calendario de los próximos 30 días.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Foco del switch hacia adentro para que la tabla con scroll no lo recorte.
 */
export function FinanzasTarjetasTab({
  eventos,
  finanzas,
  onTarjetaActualizada,
  tarjetas,
}: FinanzasTarjetasTabProps) {
  const [actualizando, setActualizando] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const eventosPorFecha = agruparEventos(eventos);

  async function cambiarEstado(tarjeta: Tarjeta) {
    setError(null);
    setActualizando((actuales) => new Set(actuales).add(tarjeta.id));
    try {
      onTarjetaActualizada(await new AlternarEstadoTarjeta(finanzas).ejecutar(tarjeta));
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : `No se pudo actualizar la tarjeta ${tarjeta.alias}.`,
      );
    } finally {
      setActualizando((actuales) => {
        const siguientes = new Set(actuales);
        siguientes.delete(tarjeta.id);
        return siguientes;
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          className="m-0 rounded-card border border-border bg-surface-active px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {tarjetas.length === 0 ? (
        <Card>
          <p className="m-0 text-sm text-muted">
            Aún no tienes tarjetas. Cárgalas desde el chat de Finanzas.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden" relleno="ninguno">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
              <caption className="sr-only">Tarjetas registradas</caption>
              <thead>
                <tr className="border-b border-divider bg-surface text-muted">
                  <th className="px-3.5 py-2.5 font-medium" scope="col">tarjeta</th>
                  <th className="px-3.5 py-2.5 font-medium" scope="col">últimos 4</th>
                  <th className="px-3.5 py-2.5 font-medium" scope="col">corte</th>
                  <th className="px-3.5 py-2.5 font-medium" scope="col">pago</th>
                  <th className="px-3.5 py-2.5 font-medium" scope="col">MSI anticipado</th>
                  <th className="px-3.5 py-2.5 font-medium" scope="col">activa</th>
                </tr>
              </thead>
              <tbody>
                {tarjetas.map((tarjeta) => (
                  <tr
                    className="border-b border-divider text-text-2 last:border-0"
                    key={tarjeta.id}
                  >
                    <th className="px-3.5 py-3 font-normal" scope="row">{tarjeta.alias}</th>
                    <td className="px-3.5 py-3 font-mono">{enmascarar(tarjeta.ultimos4)}</td>
                    <td className="px-3.5 py-3 font-mono">día {tarjeta.diaCorte}</td>
                    <td className="px-3.5 py-3 font-mono">día {tarjeta.diaPago}</td>
                    <td className="px-3.5 py-3">
                      {tarjeta.permiteLiquidarMsiAnticipado ? "Sí" : "No"}
                    </td>
                    <td className="px-3.5 py-3">
                      <button
                        aria-checked={tarjeta.activa}
                        aria-label={`${tarjeta.alias} activa`}
                        className={`relative h-6 w-10 rounded-pill border-0 p-0 transition-colors disabled:opacity-50 ${claseFocoInterno} ${
                          tarjeta.activa ? "bg-accent" : "bg-neutral-700"
                        }`}
                        disabled={actualizando.has(tarjeta.id)}
                        onClick={() => void cambiarEstado(tarjeta)}
                        role="switch"
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute top-[3px] size-[18px] rounded-pill ${
                            tarjeta.activa ? "left-[19px] bg-accent-ink" : "left-[3px] bg-text"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card aria-labelledby="calendario-titulo">
        <h2 className="m-0 text-base font-semibold" id="calendario-titulo">
          Próximos 30 días
        </h2>
        {eventos.length === 0 ? (
          <p className="m-0 text-sm text-muted">
            No hay cortes ni pagos programados en los próximos 30 días.
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {eventosPorFecha.map(([fecha, delDia]) => (
              <li className="flex flex-col gap-1.5" key={fecha}>
                <h3 className="m-0 font-mono text-xs font-normal uppercase text-faint">
                  {fechaConDiaSemana(fecha)}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {delDia.map((evento, indice) => (
                    <li
                      className="flex items-center gap-2.5 text-sm"
                      key={`${evento.tipo}-${evento.alias}-${indice}`}
                    >
                      <Tag suave={evento.tipo === "CORTE"}>
                        {evento.tipo === "PAGO" ? "pago" : "corte"}
                      </Tag>
                      {evento.alias}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
        <p className="m-0 text-xs text-faint">
          Las tarjetas inactivas no aparecen. Fines de semana y feriados: regla pendiente.
        </p>
      </Card>
    </div>
  );
}

function agruparEventos(eventos: EventoCalendario[]): Array<[string, EventoCalendario[]]> {
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

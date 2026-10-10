import { useState } from "react";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import { AlternarEstadoTarjeta } from "../application/use-cases/AlternarEstadoTarjeta";
import { CalendarioPagos, idCalendarioPagos } from "./CalendarioPagos";
import { claseBotonSobreResaltado, ProximoPago } from "./components/ProximoPago";
import { EstadoVacio } from "./components/EstadoVacio";
import { Pill } from "./components/Pill";
import { Switch } from "./components/Switch";
import { diasEntre, enmascarar, textoEnDias } from "./finanzasFormato";
import { comportamientoDeScroll } from "./movimientoReducido";

interface FinanzasTarjetasTabProps {
  eventos: EventoCalendario[];
  finanzas: FinanzasPort;
  /** Fecha de hoy AAAA-MM-DD. */
  hoy: string;
  onTarjetaActualizada: (tarjeta: Tarjeta) => void;
  tarjetas: Tarjeta[];
}

function contar(cantidad: number, singular: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : `${singular}s`}`;
}

/**
 * Tarjetas y pagos: bloque de próximo pago, "Mis tarjetas" como tiles con interruptor de activa y el calendario
 * del mes en cuadrícula. Las tarjetas inactivas quedan fuera del calendario.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Foco del switch hacia adentro para que la tabla con scroll no lo recorte.
 * @modified Daniel Tovar 2026-10-10 Usa el componente Switch (44px táctiles y pista apagada con contraste).
 * @modified Daniel Tovar 2026-10-10 Rediseño según el mockup 14: próximo pago, tiles y calendario en cuadrícula.
 */
export function FinanzasTarjetasTab({
  eventos,
  finanzas,
  hoy,
  onTarjetaActualizada,
  tarjetas,
}: FinanzasTarjetasTabProps) {
  const [actualizando, setActualizando] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const pagos = eventos.filter((evento) => evento.tipo === "PAGO");
  const proximoPago = pagos[0];
  const activas = tarjetas.filter((tarjeta) => tarjeta.activa).length;

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

  function irAlCalendario() {
    const calendario = document.getElementById(idCalendarioPagos);
    if (typeof calendario?.scrollIntoView === "function") {
      calendario.scrollIntoView({ behavior: comportamientoDeScroll(), block: "start" });
    }
    // Con el calendario cargado el foco va al día seleccionado (las flechas ya responden); si no, a la tarjeta.
    const dia = calendario?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
    (dia ?? calendario)?.focus({ preventScroll: true });
  }

  return (
    <div className="flex flex-col gap-5">
      <ProximoPago
        accion={
          <button className={claseBotonSobreResaltado} onClick={irAlCalendario} type="button">
            Ver calendario
          </button>
        }
        evento={proximoPago}
        hoy={hoy}
        tarjeta={tarjetas.find((tarjeta) => tarjeta.alias === proximoPago?.alias)}
      />

      {error && (
        <p
          className="m-0 rounded-card border border-border bg-surface-active px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <section aria-labelledby="titulo-mis-tarjetas" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-base font-semibold" id="titulo-mis-tarjetas">
            Mis tarjetas
          </h2>
          <span className="text-compact text-faint">
            {contar(activas, "activa")} · {contar(tarjetas.length - activas, "inactiva")}
          </span>
        </div>

        {tarjetas.length === 0 ? (
          <EstadoVacio mensaje="Aún no tienes tarjetas. Cárgalas desde el asistente de Finanzas." />
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(13.75rem,1fr))] gap-3 p-0">
            {tarjetas.map((tarjeta) => {
              const pago = pagos.find((evento) => evento.alias === tarjeta.alias);
              const esElProximo = pago !== undefined && pago === proximoPago;
              return (
                <li
                  className={`flex min-w-0 flex-col gap-3 rounded-card border bg-surface p-4 ${
                    tarjeta.activa ? "border-border" : "border-dashed border-border"
                  }`}
                  key={tarjeta.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`m-0 text-body font-semibold ${tarjeta.activa ? "" : "text-muted"}`}>
                      {tarjeta.alias}
                    </h3>
                    <Switch
                      activo={tarjeta.activa}
                      deshabilitado={actualizando.has(tarjeta.id)}
                      etiqueta={`${tarjeta.alias} activa`}
                      onCambiar={() => void cambiarEstado(tarjeta)}
                    />
                  </div>
                  <span className={`font-mono text-body tracking-wide ${tarjeta.activa ? "text-text-2" : "text-faint"}`}>
                    {enmascarar(tarjeta.ultimos4)}
                  </span>
                  <dl className="m-0 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-label uppercase text-faint">Corte</dt>
                      <dd className={`num m-0 ${tarjeta.activa ? "" : "text-muted"}`}>día {tarjeta.diaCorte}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-label uppercase text-faint">Pago</dt>
                      <dd className={`num m-0 ${tarjeta.activa ? "" : "text-muted"}`}>día {tarjeta.diaPago}</dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                    {tarjeta.activa ? (
                      pago ? (
                        <span
                          className={`num inline-flex items-center rounded-pill px-2 py-0.5 text-xs ${
                            esElProximo
                              ? "bg-highlight font-semibold text-highlight-ink"
                              : "bg-surface-active text-text-2"
                          }`}
                        >
                          Pago {textoEnDias(diasEntre(hoy, pago.fecha))}
                        </span>
                      ) : (
                        <span className="text-xs text-faint">Sin pago en 30 días</span>
                      )
                    ) : (
                      <Pill contorno>Inactiva</Pill>
                    )}
                    <span className="text-xs text-faint">
                      {tarjeta.activa
                        ? `MSI: ${tarjeta.permiteLiquidarMsiAnticipado ? "sí" : "no"}`
                        : "fuera del calendario"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CalendarioPagos
        fechaInicial={proximoPago?.fecha}
        finanzas={finanzas}
        hoy={hoy}
        tarjetas={tarjetas}
      />
    </div>
  );
}

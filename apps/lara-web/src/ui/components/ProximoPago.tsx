import type { ReactNode } from "react";
import type { EventoCalendario } from "../../domain/EventoCalendario";
import type { Tarjeta } from "../../domain/Tarjeta";
import { diasEntre, enmascarar, fechaConDiaSemana, textoEnDias } from "../finanzasFormato";

interface ProximoPagoProps {
  /** Próximo evento de tipo PAGO; sin él se muestra que no hay pagos próximos. */
  evento?: EventoCalendario;
  /** Tarjeta del evento, para mostrar sus últimos cuatro dígitos enmascarados. */
  tarjeta?: Tarjeta;
  /** Fecha de hoy AAAA-MM-DD, para calcular "en N días". */
  hoy: string;
  /** Acción del bloque ("Ver calendario"). */
  accion?: ReactNode;
}

/** Clases del botón "ghost" sobre el bloque destacado: borde y texto de tinta, foco con la tinta (no con accent). */
export const claseBotonSobreResaltado =
  "inline-flex min-h-11 items-center justify-center rounded-pill border border-highlight-muted px-4 text-sm font-semibold text-highlight-ink transition-colors hover:bg-highlight-muted/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight-ink";

/**
 * Bloque destacado de "Próximo pago" (Resumen y Tarjetas y pagos): alias, ••••, fecha y "en N días".
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function ProximoPago({ evento, tarjeta, hoy, accion }: ProximoPagoProps) {
  return (
    <section
      aria-label="Próximo pago"
      className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-highlight px-5 py-4.5 text-highlight-ink"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-label font-semibold uppercase text-highlight-muted">Próximo pago</span>
        {evento ? (
          <>
            <span className="text-xl font-semibold">
              {evento.alias}
              {tarjeta && (
                <span className="ml-2 font-mono text-body font-medium">{enmascarar(tarjeta.ultimos4)}</span>
              )}
            </span>
            <span className="num text-sm text-highlight-muted">
              {fechaConDiaSemana(evento.fecha)} · {textoEnDias(diasEntre(hoy, evento.fecha))}
            </span>
          </>
        ) : (
          <>
            <span className="text-xl font-semibold">Sin pagos próximos</span>
            <span className="text-sm text-highlight-muted">No hay pagos en los próximos 30 días.</span>
          </>
        )}
      </div>
      {accion}
    </section>
  );
}

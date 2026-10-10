export type EstadoPunto = "ok" | "warn" | "danger";

const formas: Record<EstadoPunto, string> = {
  ok: "rounded-full bg-ok",
  warn: "rotate-45 rounded-xs bg-warn",
  danger: "rounded-full border-2 border-danger",
};

/**
 * Indicador de estado que no depende solo del color: círculo lleno (ok), rombo (warn) y anillo hueco (danger).
 * Va siempre junto al texto del estado ("Arriba", "Sin respuesta").
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function PuntoEstado({ estado }: { estado: EstadoPunto }) {
  return <span aria-hidden="true" className={`size-2.5 shrink-0 ${formas[estado]}`} />;
}

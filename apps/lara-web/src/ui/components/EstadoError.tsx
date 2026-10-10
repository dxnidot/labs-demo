import { RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface EstadoErrorProps {
  mensaje: string;
  /** Si se pasa, muestra el botón "Reintentar". */
  onReintentar?: () => void;
  className?: string;
}

/**
 * Error común de carga: mensaje anunciado como alerta y botón para reintentar.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function EstadoError({ mensaje, onReintentar, className = "" }: EstadoErrorProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border border-border bg-surface-active p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="m-0 text-sm text-danger" role="alert">
        {mensaje}
      </p>
      {onReintentar && (
        <Button className="shrink-0" onClick={onReintentar} variant="ghost">
          <RefreshCw aria-hidden="true" className="size-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

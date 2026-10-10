import { ChevronLeft, ChevronRight } from "lucide-react";
import { etiquetaPeriodo, moverPeriodo } from "../finanzasFormato";
import { claseFocoInterno } from "./foco";

interface SelectorPeriodoProps {
  /** Periodo AAAA-MM. */
  periodo: string;
  onCambiar: (periodo: string) => void;
}

const claseFlecha = `inline-flex size-11 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-hover hover:text-text shell:size-7.5 ${claseFocoInterno}`;

/**
 * Selector de periodo con flechas "Mes anterior" y "Mes siguiente" y el mes en texto ("Septiembre 2026").
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function SelectorPeriodo({ periodo, onCambiar }: SelectorPeriodoProps) {
  return (
    <div
      aria-label="Periodo"
      className="inline-flex items-center gap-0.5 rounded-pill border border-border p-0.75"
      role="group"
    >
      <button
        aria-label="Mes anterior"
        className={claseFlecha}
        onClick={() => onCambiar(moverPeriodo(periodo, -1))}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <span aria-live="polite" className="num min-w-32 text-center text-sm font-medium">
        {etiquetaPeriodo(periodo)}
      </span>
      <button
        aria-label="Mes siguiente"
        className={claseFlecha}
        onClick={() => onCambiar(moverPeriodo(periodo, 1))}
        type="button"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

import { claseFocoInterno } from "./foco";

interface SwitchProps {
  activo: boolean;
  /** Nombre accesible del control, p. ej. "Tarjeta A activa". */
  etiqueta: string;
  deshabilitado?: boolean;
  onCambiar: () => void;
}

/**
 * Interruptor accesible (role="switch") con área táctil de 44px y pista apagada con contraste >= 3:1.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function Switch({ activo, etiqueta, deshabilitado = false, onCambiar }: SwitchProps) {
  return (
    <button
      aria-checked={activo}
      aria-label={etiqueta}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-button disabled:opacity-50 ${claseFocoInterno}`}
      disabled={deshabilitado}
      onClick={onCambiar}
      role="switch"
      type="button"
    >
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 rounded-pill transition-colors ${activo ? "bg-accent" : "bg-control-off"}`}
      >
        <span
          className={`absolute left-0.75 top-0.75 size-4.5 rounded-pill transition-transform ${
            activo ? "translate-x-4 bg-accent-ink" : "bg-surface"
          }`}
        />
      </span>
    </button>
  );
}

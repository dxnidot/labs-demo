import type { Modelo } from "../../domain/Modelo";
import { claseFoco } from "./foco";

interface SelectorModeloProps {
  modelos: Modelo[];
  seleccionado: string;
  onCambiar: (id: string) => void;
}

/**
 * Lista desplegable para elegir el modelo de LLM que atiende el chat.
 * @author Daniel Tovar
 * @since 2026-10-01
 */
export function SelectorModelo({ modelos, seleccionado, onCambiar }: SelectorModeloProps) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Modelo</span>
      <select
        className={`rounded-button border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-muted outline-none hover:bg-surface-hover ${claseFoco}`}
        onChange={(event) => onCambiar(event.target.value)}
        value={seleccionado}
      >
        {modelos.map((modelo) => (
          <option key={modelo.id} value={modelo.id}>
            {modelo.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { esFuenteUi, fuentesUi } from "../../domain/Apariencia";
import { IconButton } from "../components/IconButton";
import { useTrampaFoco } from "../useTrampaFoco";
import { useApariencia } from "./useApariencia";

interface DialogoAparienciaProps {
  onCerrar: () => void;
}

const idTitulo = "titulo-apariencia";

/**
 * Diálogo modal "Apariencia": elige la fuente de la interfaz y la guarda en lara.fuente.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function DialogoApariencia({ onCerrar }: DialogoAparienciaProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const { fuente, cambiarFuente } = useApariencia();
  useTrampaFoco(true, onCerrar, panel);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 p-4"
      data-testid="fondo-apariencia"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCerrar();
        }
      }}
    >
      <div
        aria-labelledby={idTitulo}
        aria-modal="true"
        className="flex w-full max-w-md flex-col gap-5 rounded-card border border-border bg-surface p-5 outline-none"
        ref={panel}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold" id={idTitulo}>
            Apariencia
          </h2>
          <IconButton aria-label="Cerrar apariencia" onClick={onCerrar} tono="atenuado">
            <X aria-hidden="true" className="size-4.5" />
          </IconButton>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 font-mono text-xs tracking-label text-faint">FUENTE</legend>
          {fuentesUi.map((opcion) => (
            <label
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-button border border-border px-3 text-sm text-text-2 has-checked:bg-surface-active has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
              key={opcion.id}
            >
              <input
                checked={fuente === opcion.id}
                className="size-4 accent-accent"
                name="fuente-ui"
                onChange={(event) => {
                  if (esFuenteUi(event.target.value)) {
                    cambiarFuente(event.target.value);
                  }
                }}
                type="radio"
                value={opcion.id}
              />
              {opcion.nombre}
            </label>
          ))}
        </fieldset>
        <p className="m-0 text-compact text-faint">
          Los datos técnicos (puertos, ids, SQL) siempre se muestran en IBM Plex Mono.
        </p>
      </div>
    </div>
  );
}

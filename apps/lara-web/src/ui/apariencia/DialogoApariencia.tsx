import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { esFuenteUi, esPreferenciaTema, fuentesUi, temasUi } from "../../domain/Apariencia";
import { IconButton } from "../components/IconButton";
import { useTrampaFoco } from "../useTrampaFoco";
import { useApariencia } from "./useApariencia";

interface DialogoAparienciaProps {
  onCerrar: () => void;
}

const idTitulo = "titulo-apariencia";

interface GrupoOpcionesProps {
  etiqueta: string;
  name: string;
  onElegir: (id: string) => void;
  opciones: readonly { id: string; nombre: string }[];
  seleccionada: string;
}

function GrupoOpciones({ etiqueta, name, onElegir, opciones, seleccionada }: GrupoOpcionesProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 font-mono text-label text-faint">{etiqueta}</legend>
      {opciones.map((opcion) => (
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-button border border-border px-3 text-sm text-text-2 has-checked:bg-surface-active has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          key={opcion.id}
        >
          <input
            checked={seleccionada === opcion.id}
            className="size-4 accent-accent"
            name={name}
            onChange={(event) => onElegir(event.target.value)}
            type="radio"
            value={opcion.id}
          />
          {opcion.nombre}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Diálogo modal "Apariencia": elige el tema (lara.tema) y la fuente de la interfaz (lara.fuente).
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function DialogoApariencia({ onCerrar }: DialogoAparienciaProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const { fuente, cambiarFuente, tema, cambiarTema } = useApariencia();
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

        <GrupoOpciones
          etiqueta="TEMA"
          name="tema-ui"
          onElegir={(id) => esPreferenciaTema(id) && cambiarTema(id)}
          opciones={temasUi}
          seleccionada={tema}
        />
        <GrupoOpciones
          etiqueta="FUENTE"
          name="fuente-ui"
          onElegir={(id) => esFuenteUi(id) && cambiarFuente(id)}
          opciones={fuentesUi}
          seleccionada={fuente}
        />
        <p className="m-0 text-compact text-faint">
          Los datos técnicos (puertos, ids, SQL) siempre se muestran en IBM Plex Mono.
        </p>
      </div>
    </div>
  );
}

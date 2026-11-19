import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { IconButton } from "./components/IconButton";
import { PuntoEstado } from "./components/PuntoEstado";
import { claseFoco, claseFocoContenedor } from "./components/foco";

function ChipEstado({ texto }: { texto: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-pill border border-border px-3 text-compact text-text-2">
      <PuntoEstado estado="ok" />
      {texto}
    </span>
  );
}

interface ComposerChatProps {
  /** Clase de la caja del formulario (padding y relleno cambian entre el estado inicial y el pie). */
  className: string;
  /** Bloquea el campo de texto (envío o carga de sesión en curso). */
  campoDeshabilitado: boolean;
  /** Bloquea solo el botón Enviar. */
  envioDeshabilitado: boolean;
  idAviso: string;
  idCampo: string;
  onCambiar: (texto: string) => void;
  onComposicion: (activa: boolean) => void;
  onEnviar: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  texto: string;
}

/**
 * Caja de mensaje del chat: campo, adjuntar (aún sin backend), chips de agente y memoria, y Enviar.
 * @author Daniel Tovar
 * @since 2026-11-19
 */
export function ComposerChat({
  className,
  campoDeshabilitado,
  envioDeshabilitado,
  idAviso,
  idCampo,
  onCambiar,
  onComposicion,
  onEnviar,
  onKeyDown,
  placeholder,
  rows,
  texto,
}: ComposerChatProps) {
  return (
    <form className={`${className} ${claseFocoContenedor}`} onSubmit={onEnviar}>
      <label className="sr-only" htmlFor={idCampo}>
        Mensaje para Lara
      </label>
      <textarea
        aria-describedby={idAviso}
        className="w-full resize-none bg-transparent text-body text-text outline-none placeholder:text-faint"
        disabled={campoDeshabilitado}
        id={idCampo}
        onChange={(event) => onCambiar(event.target.value)}
        onCompositionEnd={() => onComposicion(false)}
        onCompositionStart={() => onComposicion(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        value={texto}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Sin backend de carga en el chat general: se deshabilita en vez de aceptar un archivo que se descartaría. */}
          <IconButton
            aria-label="Adjuntar archivo (aún no disponible)"
            disabled
            tamano="compacto"
            title="Adjuntar archivo: aún no disponible"
            type="button"
          >
            <Paperclip aria-hidden="true" className="size-4.5" />
          </IconButton>
          <ChipEstado texto="Agente: orquestador" />
          <ChipEstado texto="Memoria: activa" />
        </div>
        <button
          aria-label="Enviar"
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-button bg-accent text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 shell:size-10 ${claseFoco}`}
          disabled={envioDeshabilitado}
          type="submit"
        >
          <ArrowUp aria-hidden="true" className="size-4.5" />
        </button>
      </div>
    </form>
  );
}

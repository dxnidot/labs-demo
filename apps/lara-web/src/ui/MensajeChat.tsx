import { memo } from "react";
import { Check } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Mensaje } from "../domain/Mensaje";
import { LaraLogo } from "./components/LaraLogo";

const componentesMarkdown: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-2xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-semibold">{children}</h2>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-card border border-border bg-bg p-4">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={
        className
          ? "font-mono text-sm text-text-2"
          : "rounded bg-bg px-1 font-mono text-sm text-accent"
      }
    >
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-surface px-3 py-2">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-accent pl-4 text-muted">
      {children}
    </blockquote>
  ),
};

/** Separador A2A centrado en mono, con los pasos del flujo determinista cuando los hay (mockup 04). */
export function MensajeEvento({ mensaje }: { mensaje: Mensaje }) {
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-divider" />
        <span className="font-mono">{mensaje.texto}</span>
        <span className="h-px flex-1 bg-divider" />
      </div>
      {mensaje.pasos && mensaje.pasos.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 rounded-card border border-border bg-surface p-3.5 text-sm">
          {mensaje.pasos.map((paso) => (
            <li className="flex items-center justify-between gap-3" key={paso.clave}>
              <span className="flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className={`size-4 shrink-0 ${paso.completado ? "text-ok" : "text-faint opacity-0"}`}
                />
                {paso.nombre}
              </span>
              <span className="font-mono text-xs text-faint">{paso.clave}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MensajeConversacionProps {
  mensaje: Mensaje;
  /** Es el último mensaje y el agente todavía no escribe texto: muestra "…". */
  pendiente: boolean;
}

/**
 * Mensaje del usuario o del agente (con Markdown). Memoizado: durante el streaming solo se vuelve
 * a renderizar el último mensaje, no toda la conversación.
 * @author Daniel Tovar
 * @since 2026-11-19
 */
export const MensajeConversacion = memo(function MensajeConversacion({
  mensaje,
  pendiente,
}: MensajeConversacionProps) {
  return (
    <article
      className={
        mensaje.rol === "usuario"
          ? "max-w-4/5 self-end rounded-card bg-surface-active px-4 py-3 text-body"
          : "flex w-full gap-3.5 text-body leading-body"
      }
    >
      {mensaje.rol === "agente" && (
        <span className="inline-flex size-7.5 shrink-0 items-center justify-center rounded-button border border-border bg-surface">
          <LaraLogo soloL tamano={18} />
        </span>
      )}
      <div className="min-w-0 break-words">
        {mensaje.rol === "usuario" ? (
          <p className="m-0 whitespace-pre-wrap">{mensaje.texto}</p>
        ) : (
          <div className="text-text">
            {mensaje.texto ? (
              <ReactMarkdown components={componentesMarkdown} remarkPlugins={[remarkGfm]}>
                {mensaje.texto}
              </ReactMarkdown>
            ) : (
              pendiente && <span className="text-muted">…</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
});

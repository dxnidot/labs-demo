import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Mensaje } from "../domain/Mensaje";
import type { Usuario } from "../domain/Usuario";
import { Button } from "./components/Button";
import { LaraLogo } from "./components/LaraLogo";
import { modeloOrquestador } from "../agentesConfig";
import { useChatSessions } from "./useChatSessions";

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

const sugerencias = [
  "¿Cuánto llevo en gastos este mes?",
  "¿Cuáles son mis próximos pagos de tarjeta?",
  "Muéstrame el resumen financiero del mes",
  "¿Me conviene pagar el total o el mínimo de mi tarjeta?",
];

function ChipAgente() {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-pill border border-border px-3 text-[13px] text-text-2">
      <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
      Agente: orquestador
    </span>
  );
}

function BotonEnviar({ deshabilitado }: { deshabilitado: boolean }) {
  return (
    <button
      aria-label="Enviar"
      className="inline-flex size-10 items-center justify-center rounded-[10px] bg-accent text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      disabled={deshabilitado}
      type="submit"
    >
      <ArrowUp aria-hidden="true" className="size-[18px]" />
    </button>
  );
}

/**
 * Presenta la conversación de Lara y su respuesta en streaming.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Mueve navegación al shell y titula la sesión inicial.
 * @modified Daniel Tovar 2026-09-30 Actualiza sugerencias al enfoque de finanzas personales.
 * @modified Daniel 2026-09-30 Reutiliza el puerto de sesión compartido con Finanzas.
 * @modified Daniel Tovar 2026-09-30 Ajustado a las maquetas 03 y 04 (logo, composer, sugerencias de finanzas).
 */
export function ChatPage({ usuario }: { usuario: Usuario }) {
  const {
    activeSessionId,
    refreshSessions,
    sessions,
    setActiveSessionId,
    obtenerSesion,
    enviarMensaje,
  } = useChatSessions();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarIrAlFinal, setMostrarIrAlFinal] = useState(false);
  const composicionActiva = useRef(false);
  const listaMensajesRef = useRef<HTMLElement>(null);
  const seguirAlFinal = useRef(true);

  useEffect(() => {
    if (!activeSessionId) {
      setMensajes([]);
      return;
    }

    let active = true;
    setError(null);
    setCargandoSesion(true);
    setMensajes([]);
    obtenerSesion(activeSessionId)
      .then((sessionMessages) => {
        if (active) {
          setMensajes(sessionMessages);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "No se pudo abrir la conversación.");
        }
      })
      .finally(() => {
        if (active) {
          setCargandoSesion(false);
        }
      });
    return () => {
      active = false;
    };
  }, [activeSessionId, obtenerSesion]);

  useEffect(() => {
    const list = listaMensajesRef.current;
    if (list && seguirAlFinal.current) {
      list.scrollTop = list.scrollHeight;
      setMostrarIrAlFinal(false);
    }
  }, [mensajes, estado, cargandoSesion]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargando || cargandoSesion || composicionActiva.current) {
      return;
    }

    setError(null);
    setCargando(true);
    setTexto("");
    seguirAlFinal.current = true;
    setMensajes((actuales) => [
      ...actuales,
      { rol: "usuario", texto: mensaje, fecha: new Date() },
      { rol: "agente", texto: "", fecha: new Date() },
    ]);

    let receivedText = false;
    try {
      const sentSessionId = await enviarMensaje(
        mensaje,
        activeSessionId,
        (update) => {
          if (update.tipo === "herramienta") {
            setEstado(`Consultando ${update.nombre}…`);
            return;
          }

          receivedText = true;
          setEstado("");
          setMensajes((actuales) =>
            actuales.map((item, index) =>
              index === actuales.length - 1 && item.rol === "agente"
                ? {
                    ...item,
                    texto:
                      update.operacion === "agregar"
                        ? item.texto + update.texto
                        : update.texto,
                  }
                : item,
            ),
          );
        },
      );
      setActiveSessionId(sentSessionId);
      if (!receivedText) {
        throw new Error("El agente terminó el flujo sin una respuesta de texto.");
      }
      await refreshSessions();
    } catch (reason: unknown) {
      setMensajes((actuales) =>
        actuales.filter(
          (item, index) =>
            index !== actuales.length - 1 || item.rol !== "agente" || item.texto.length > 0,
        ),
      );
      setError(reason instanceof Error ? reason.message : "No se pudo completar el mensaje.");
    } finally {
      setEstado("");
      setCargando(false);
    }
  }

  function desplazarAlFinal() {
    const list = listaMensajesRef.current;
    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
      seguirAlFinal.current = true;
      setMostrarIrAlFinal(false);
    }
  }

  const sesionActiva = sessions.find((sesion) => sesion.id === activeSessionId);

  function alPulsarTecla(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (!composicionActiva.current && !cargando && texto.trim()) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {(mensajes.length > 0 || cargandoSesion) && (
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-divider px-6">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="m-0 truncate text-[15px] font-medium">
              {sesionActiva?.titulo ?? "Nuevo chat"}
            </h1>
            <span className="whitespace-nowrap rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-xs text-muted">
              {`orquestador · ${modeloOrquestador.split("/")[1]}`}
            </span>
          </div>
        </header>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <section
          aria-label="Conversación"
          aria-live="polite"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-8"
          onScroll={(event) => {
            const element = event.currentTarget;
            const alFinal = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
            seguirAlFinal.current = alFinal;
            setMostrarIrAlFinal(!alFinal);
          }}
          ref={listaMensajesRef}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-6">
            {mensajes.length === 0 && !cargandoSesion && (
              <div className="m-auto flex w-full max-w-[760px] flex-col gap-7 py-6">
                <div className="flex items-center gap-3.5">
                  <LaraLogo tamano={36} />
                  <h1 className="m-0 text-[34px] font-medium tracking-[-0.02em]">
                    Hola, {usuario.username}. ¿En qué te ayudo?
                  </h1>
                </div>
                <form
                  className="flex flex-col gap-3 rounded-composer border border-border bg-surface p-4"
                  onSubmit={enviar}
                >
                  <label className="sr-only" htmlFor="mensaje">
                    Mensaje para Lara
                  </label>
                  <textarea
                    className="w-full resize-none bg-transparent text-[15px] text-text outline-none placeholder:text-faint"
                    disabled={cargando}
                    id="mensaje"
                    onChange={(event) => setTexto(event.target.value)}
                    onCompositionEnd={() => {
                      composicionActiva.current = false;
                    }}
                    onCompositionStart={() => {
                      composicionActiva.current = true;
                    }}
                    onKeyDown={alPulsarTecla}
                    placeholder="Pregunta por tus gastos, tus tarjetas o tu calendario de pagos…"
                    rows={3}
                    value={texto}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <ChipAgente />
                    <BotonEnviar deshabilitado={cargando || !texto.trim()} />
                  </div>
                </form>
                <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
                  {sugerencias.map((sugerencia) => (
                    <button
                      className="flex flex-col gap-1.5 rounded-[12px] border border-border bg-surface p-4 text-left text-sm transition-colors hover:border-neutral-700 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      key={sugerencia}
                      onClick={() => setTexto(sugerencia)}
                      type="button"
                    >
                      <span className="font-mono text-xs text-faint">finanzas</span>
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cargandoSesion && <p className="m-auto text-sm text-muted">Cargando conversación…</p>}

            {mensajes.map((mensaje, index) => (
              <article
                className={
                  mensaje.rol === "usuario"
                    ? "max-w-[80%] self-end rounded-[14px] bg-surface-active px-4 py-3 text-[15px] leading-[1.55]"
                    : "flex w-full gap-3.5 text-[15px] leading-[1.6]"
                }
                key={`${mensaje.fecha.getTime()}-${index}`}
              >
                {mensaje.rol === "agente" && (
                  <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface">
                    <LaraLogo tamano={18} />
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
                        cargando && <span className="text-muted">…</span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {estado && <p className="mx-auto font-mono text-xs text-muted">{estado}</p>}
            {error && (
              <p className="rounded-card border border-border bg-surface-active px-4 py-3 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {mostrarIrAlFinal && (
          <Button
            className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
            onClick={desplazarAlFinal}
          >
            Ir al final ↓
          </Button>
        )}
      </div>

      {(mensajes.length > 0 || cargandoSesion) && (
        <footer className="shrink-0 px-6 pb-5">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2.5">
            <form
              className="flex flex-col gap-3 rounded-composer border border-border bg-surface py-3.5 pl-4 pr-3.5"
              onSubmit={enviar}
            >
              <label className="sr-only" htmlFor="mensaje-chat">
                Mensaje para Lara
              </label>
              <textarea
                className="w-full resize-none bg-transparent text-[15px] text-text outline-none placeholder:text-faint"
                disabled={cargando || cargandoSesion}
                id="mensaje-chat"
                onChange={(event) => setTexto(event.target.value)}
                onCompositionEnd={() => {
                  composicionActiva.current = false;
                }}
                onCompositionStart={() => {
                  composicionActiva.current = true;
                }}
                onKeyDown={alPulsarTecla}
                placeholder="Escribe a Lara…"
                rows={2}
                value={texto}
              />
              <div className="flex items-center justify-between gap-2">
                <ChipAgente />
                <BotonEnviar deshabilitado={cargando || cargandoSesion || !texto.trim()} />
              </div>
            </form>
            <p className="m-0 text-center text-xs text-faint">
              Lara puede equivocarse. Verifica los datos importantes.
            </p>
          </div>
        </footer>
      )}
    </section>
  );
}

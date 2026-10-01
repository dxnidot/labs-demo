import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Clock3 } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Mensaje } from "../domain/Mensaje";
import type { Usuario } from "../domain/Usuario";
import { Button } from "./components/Button";
import { Pill } from "./components/Pill";
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
  {
    tone: "mint" as const,
    etiqueta: "finanzas",
    texto: "¿Cuánto llevo en gastos fijos este mes?",
  },
  {
    tone: "peach" as const,
    etiqueta: "cálculos",
    texto: "¿Me conviene pagar el total o el mínimo de mi tarjeta?",
  },
  {
    tone: "lavender" as const,
    etiqueta: "traductor",
    texto: "Traduce este texto al inglés",
  },
  {
    tone: "accent" as const,
    etiqueta: "memoria",
    texto: "¿Qué hablamos la última vez sobre mi presupuesto?",
  },
];

const colorEtiqueta = {
  accent: "text-accent",
  mint: "text-mint",
  lavender: "text-lavender",
  pink: "text-pink",
  butter: "text-butter",
  peach: "text-peach",
};

/**
 * Presenta la conversación de Lara y su respuesta en streaming.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Mueve navegación al shell y titula la sesión inicial.
 * @modified Daniel Tovar 2026-09-30 Actualiza sugerencias al enfoque de finanzas personales.
 * @modified Daniel 2026-09-30 Reutiliza el puerto de sesión compartido con Finanzas.
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

  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-divider px-6 min-[980px]:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-lg font-semibold">
              {sesionActiva?.titulo ?? "Nuevo chat"}
            </h1>
            <Pill tone="accent">orquestador · streaming</Pill>
          </div>
          <span className="hidden text-sm text-muted min-[640px]:block">
            {usuario.username}
          </span>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <section
            aria-label="Conversación"
            aria-live="polite"
            className="min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[640px]:px-8 min-[640px]:py-8"
            onScroll={(event) => {
              const element = event.currentTarget;
              const alFinal =
                element.scrollHeight - element.scrollTop - element.clientHeight < 48;
              seguirAlFinal.current = alFinal;
              setMostrarIrAlFinal(!alFinal);
            }}
            ref={listaMensajesRef}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-7">
              {mensajes.length === 0 && !cargandoSesion && (
                <div className="m-auto w-full max-w-[760px] py-8">
                  <div className="mb-8 flex items-center gap-4">
                    <Clock3 aria-hidden="true" className="size-10 shrink-0 text-accent" />
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Hola, {usuario.username}. ¿En qué te ayudo?
                    </h2>
                  </div>
                  <form
                    className="rounded-composer border border-border bg-surface p-4"
                    onSubmit={enviar}
                  >
                    <label className="sr-only" htmlFor="mensaje">
                      Mensaje
                    </label>
                    <textarea
                      className="min-h-24 w-full resize-y bg-transparent p-2 text-[15px] leading-relaxed text-text outline-none placeholder:text-muted"
                      disabled={cargando}
                      id="mensaje"
                      onChange={(event) => setTexto(event.target.value)}
                      onCompositionEnd={() => {
                        composicionActiva.current = false;
                      }}
                      onCompositionStart={() => {
                        composicionActiva.current = true;
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key !== "Enter" ||
                          event.shiftKey ||
                          event.nativeEvent.isComposing
                        ) {
                          return;
                        }
                        event.preventDefault();
                        if (!composicionActiva.current && !cargando && texto.trim()) {
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Pregunta por tus gastos, tu tarjeta o pide una traducción…"
                      rows={2}
                      value={texto}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <Pill tone="mint">● Agente: orquestador</Pill>
                      <Button disabled={cargando || !texto.trim()} variant="primary">
                        <ArrowUp aria-hidden="true" className="size-4" />
                        Enviar
                      </Button>
                    </div>
                  </form>
                  <div className="mt-5 grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
                    {sugerencias.map((sugerencia) => (
                      <button
                        className="rounded-card border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-hover"
                        key={sugerencia.etiqueta}
                        onClick={() => setTexto(sugerencia.texto)}
                        type="button"
                      >
                        <span className={`mb-2 block font-mono text-xs ${colorEtiqueta[sugerencia.tone]}`}>
                          {sugerencia.etiqueta}
                        </span>
                        <span className="text-sm">{sugerencia.texto}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cargandoSesion && (
                <p className="m-auto text-sm text-muted">Cargando conversación…</p>
              )}

              {mensajes.map((mensaje, index) => (
                <article
                  className={
                    mensaje.rol === "usuario"
                      ? "ml-auto max-w-[85%] rounded-card bg-surface-active px-5 py-4 text-[15px] leading-relaxed"
                      : "mr-auto flex w-full max-w-[760px] gap-4 text-[15px] leading-relaxed"
                  }
                  key={`${mensaje.fecha.getTime()}-${index}`}
                >
                  {mensaje.rol === "agente" && (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-button border border-border bg-surface font-semibold text-accent">
                      L
                    </span>
                  )}
                  <div className="min-w-0 break-words">
                    {mensaje.rol === "usuario" ? (
                      <p className="whitespace-pre-wrap">{mensaje.texto}</p>
                    ) : (
                      <div className="text-text">
                        {mensaje.texto ? (
                          <ReactMarkdown
                            components={componentesMarkdown}
                            remarkPlugins={[remarkGfm]}
                          >
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
                <p className="rounded-card border border-pink/30 bg-pill-pink px-4 py-3 text-sm text-pink">
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
          <footer className="shrink-0 px-5 pb-3 pt-2 min-[640px]:px-8">
            <form
              className="mx-auto w-full max-w-[760px] rounded-composer border border-border bg-surface p-3"
              onSubmit={enviar}
            >
              <label className="sr-only" htmlFor="mensaje-chat">
                Mensaje
              </label>
              <textarea
                className="min-h-14 w-full resize-y bg-transparent px-2 py-2 text-[15px] leading-relaxed text-text outline-none placeholder:text-muted"
                disabled={cargando || cargandoSesion}
                onChange={(event) => setTexto(event.target.value)}
                onCompositionEnd={() => {
                  composicionActiva.current = false;
                }}
                onCompositionStart={() => {
                  composicionActiva.current = true;
                }}
                onKeyDown={(event) => {
                  if (
                    event.key !== "Enter" ||
                    event.shiftKey ||
                    event.nativeEvent.isComposing
                  ) {
                    return;
                  }
                  event.preventDefault();
                  if (!composicionActiva.current && !cargando && texto.trim()) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                id="mensaje-chat"
                placeholder="Escribe a Lara…"
                rows={1}
                value={texto}
              />
              <div className="flex items-center justify-between px-2 pt-1">
                <Pill tone="mint">● Agente: orquestador</Pill>
                <Button disabled={cargando || !texto.trim()} variant="primary">
                  <ArrowUp aria-hidden="true" className="size-4" />
                  {cargando ? "Enviando…" : "Enviar"}
                </Button>
              </div>
            </form>
            <p className="mx-auto mt-2 max-w-[760px] text-center text-xs text-faint">
              Lara puede equivocarse. Verifica los datos importantes.
            </p>
          </footer>
        )}
      </section>
    </>
  );
}

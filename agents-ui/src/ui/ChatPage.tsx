import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Mensaje } from "../domain/Mensaje";
import type { SesionChat } from "../domain/SesionChat";
import type { Usuario } from "../domain/Usuario";
import { AdkAgenteAdapter } from "../infrastructure/adapters/AdkAgenteAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { EnviarMensaje } from "../application/use-cases/EnviarMensaje";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";
import { Button } from "./components/Button";
import { IconButton } from "./components/IconButton";
import { Pill } from "./components/Pill";
import { Sidebar } from "./components/Sidebar";
import { SidebarItem } from "./components/SidebarItem";

const iniciarSesion = new IniciarSesion(keycloakAuthAdapter);
const agente = new AdkAgenteAdapter(keycloakAuthAdapter);
const enviarMensaje = new EnviarMensaje(keycloakAuthAdapter, agente);

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
  { tone: "lavender" as const, etiqueta: "menu · A2A", texto: "¿Qué opciones de menú tengo?" },
  {
    tone: "pink" as const,
    etiqueta: "aclaraciones · A2A",
    texto: "Quiero levantar una aclaración",
  },
  { tone: "accent" as const, etiqueta: "memoria", texto: "¿Cómo configuro PKCE?" },
  { tone: "mint" as const, etiqueta: "finanzas", texto: "¿Cuánto llevo en gastos fijos?" },
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
 * Presenta Lara con historial de sesiones y conversación en streaming.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Añade shell Lara e historial de sesiones.
 */
export function ChatPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sesiones, setSesiones] = useState<SesionChat[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("Conectando con Keycloak…");
  const [cargando, setCargando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarIrAlFinal, setMostrarIrAlFinal] = useState(false);
  const composicionActiva = useRef(false);
  const listaMensajesRef = useRef<HTMLElement>(null);
  const seguirAlFinal = useRef(true);

  const actualizarRecientes = useCallback(async (userId: string) => {
    setCargandoHistorial(true);
    try {
      setSesiones(await agente.listarSesiones(userId));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar el historial.");
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    iniciarSesion
      .ejecutar()
      .then((autenticado) => {
        if (activo) {
          setUsuario(autenticado);
          setEstado("");
        }
      })
      .catch((reason: unknown) => {
        if (activo) {
          setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión.");
          setEstado("");
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (usuario) {
      void actualizarRecientes(usuario.id);
    }
  }, [actualizarRecientes, usuario]);

  useEffect(() => {
    const list = listaMensajesRef.current;
    if (list && seguirAlFinal.current) {
      list.scrollTop = list.scrollHeight;
      setMostrarIrAlFinal(false);
    }
  }, [mensajes, estado, cargandoSesion]);

  async function iniciarChatNuevo() {
    if (!usuario || cargando || cargandoSesion) {
      return;
    }
    setError(null);
    setCargandoSesion(true);
    try {
      const newSessionId = await agente.crearSesion(usuario.id);
      setSessionId(newSessionId);
      setMensajes([]);
      setTexto("");
      setEstado("");
      seguirAlFinal.current = true;
      setMostrarIrAlFinal(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear una sesión.");
    } finally {
      setCargandoSesion(false);
    }
  }

  async function seleccionarSesion(sesion: SesionChat) {
    if (!usuario || cargando || cargandoSesion) {
      return;
    }
    setError(null);
    setCargandoSesion(true);
    setSessionId(sesion.id);
    setMensajes([]);
    seguirAlFinal.current = true;
    try {
      setMensajes(await agente.obtenerSesion(usuario.id, sesion.id));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo abrir la conversación.");
    } finally {
      setCargandoSesion(false);
    }
  }

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
      const activeSessionId = await enviarMensaje.ejecutar(
        mensaje,
        sessionId,
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
      setSessionId(activeSessionId);
      if (!receivedText) {
        throw new Error("El agente terminó el flujo sin una respuesta de texto.");
      }
      if (usuario) {
        await actualizarRecientes(usuario.id);
      }
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

  async function cerrarSesion() {
    try {
      await keycloakAuthAdapter.logout();
    } catch {
      setError("No se pudo cerrar la sesión de Keycloak.");
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

  const sesionActiva = sesiones.find((sesion) => sesion.id === sessionId);

  if (!usuario) {
    return (
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-bg px-6 text-text">
        <section className="w-full max-w-md rounded-card border border-border bg-surface p-8">
          <p className="font-mono text-sm text-accent">Lara · LOCAL</p>
          <h1 className="mt-3 text-2xl font-semibold">Iniciando sesión</h1>
          <p className="mt-3 text-sm text-muted">{error ?? estado}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-bg font-sans text-text">
      <Sidebar>
        <div className="flex items-center gap-3 border-b border-divider pb-5">
          <span aria-hidden="true" className="text-3xl leading-none text-accent">
            ◷
          </span>
          <span className="text-2xl font-semibold">Lara</span>
        </div>

        <div className="pt-5">
          <Button
            className="w-full justify-start"
            disabled={cargando || cargandoSesion}
            onClick={() => void iniciarChatNuevo()}
            variant="primary"
          >
            <span aria-hidden="true" className="text-xl leading-none">+</span>
            Nuevo chat
          </Button>
        </div>

        <section aria-label="Recientes" className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between px-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">
              Recientes
            </h2>
            {cargandoHistorial && <span className="text-xs text-muted">Cargando…</span>}
          </div>
          <nav aria-label="Historial de chats" className="space-y-1">
            {sesiones.map((sesion) => (
              <SidebarItem
                active={sesion.id === sessionId}
                key={sesion.id}
                onClick={() => void seleccionarSesion(sesion)}
              >
                {sesion.titulo}
              </SidebarItem>
            ))}
            {!cargandoHistorial && sesiones.length === 0 && (
              <p className="px-3 py-2 text-xs text-faint">Aún no hay conversaciones.</p>
            )}
          </nav>
        </section>

        <footer className="mt-4 flex items-center gap-3 border-t border-divider pt-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface-active font-semibold text-accent">
            {usuario.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{usuario.username}</p>
            <p className="truncate font-mono text-xs text-muted">
              {usuario.roles[0] ?? "LOCAL"} · LOCAL
            </p>
          </div>
          <IconButton aria-label="Cerrar sesión" onClick={() => void cerrarSesion()}>
            <span aria-hidden="true">↪</span>
          </IconButton>
        </footer>
      </Sidebar>

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
                    <span aria-hidden="true" className="text-4xl leading-none text-accent">◷</span>
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
                      placeholder="Pregunta, pide una aclaración o busca en tu memoria…"
                      rows={2}
                      value={texto}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <Pill tone="mint">● Agente: orquestador</Pill>
                      <Button disabled={cargando || !texto.trim()} variant="primary">
                        <span aria-hidden="true">↑</span>
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
                  <span aria-hidden="true">↑</span>
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
    </main>
  );
}

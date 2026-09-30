import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Mensaje } from "../domain/Mensaje";
import type { Usuario } from "../domain/Usuario";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { AdkAgenteAdapter } from "../infrastructure/adapters/AdkAgenteAdapter";
import { EnviarMensaje } from "../application/use-cases/EnviarMensaje";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";

const iniciarSesion = new IniciarSesion(keycloakAuthAdapter);
const enviarMensaje = new EnviarMensaje(
  keycloakAuthAdapter,
  new AdkAgenteAdapter(keycloakAuthAdapter),
);

const componentesMarkdown: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-2xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-semibold">{children}</h2>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-950 p-4">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={
        className
          ? "text-sm text-cyan-100"
          : "rounded bg-zinc-950/70 px-1 text-cyan-200"
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
    <th className="border border-zinc-700 bg-zinc-800 px-3 py-2">{children}</th>
  ),
  td: ({ children }) => <td className="border border-zinc-700 px-3 py-2">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-cyan-500 pl-4 text-zinc-300">
      {children}
    </blockquote>
  ),
};

/**
 * Presenta el chat autenticado y las respuestas del agente en streaming.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Añade envío con Enter y Markdown seguro.
 */
export function ChatPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("Conectando con Keycloak…");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composicionActiva = useRef(false);

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

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargando || composicionActiva.current) {
      return;
    }

    setError(null);
    setCargando(true);
    setTexto("");
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
      if (!receivedText) {
        throw new Error("El agente terminó el flujo sin una respuesta de texto.");
      }
      setSessionId(activeSessionId);
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

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <p className="text-sm font-medium text-cyan-300">Lara · Chat</p>
          <h1 className="mt-3 text-2xl font-semibold">Iniciando sesión</h1>
          <p className="mt-3 text-sm text-zinc-400">{error ?? estado}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <p className="text-sm font-medium text-cyan-300">Lara · Chat</p>
          <h1 className="mt-1 text-lg font-semibold">Asistente</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-300">{usuario.username}</span>
          <button
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
            onClick={() => void cerrarSesion()}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section
        aria-label="Conversación"
        aria-live="polite"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 overflow-y-auto px-6 py-8"
      >
        {mensajes.length === 0 && (
          <div className="m-auto max-w-lg text-center">
            <p className="text-sm font-medium text-cyan-300">Sesión autenticada</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">¿En qué te ayudo?</h2>
            <p className="mt-3 text-zinc-400">Escribe un mensaje para conversar con el agente.</p>
          </div>
        )}
        {mensajes.map((mensaje, index) => (
          <article
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              mensaje.rol === "usuario"
                ? "ml-auto bg-cyan-950 text-cyan-50"
                : "mr-auto border border-zinc-800 bg-zinc-900 text-zinc-100"
            }`}
            key={`${mensaje.fecha.getTime()}-${index}`}
          >
            <p className="mb-1 text-xs font-medium text-zinc-400">
              {mensaje.rol === "usuario" ? usuario.username : "Lara"}
            </p>
            {mensaje.rol === "usuario" ? (
              <p className="whitespace-pre-wrap break-words">{mensaje.texto}</p>
            ) : (
              <div className="break-words">
                {mensaje.texto ? (
                  <ReactMarkdown
                    components={componentesMarkdown}
                    remarkPlugins={[remarkGfm]}
                  >
                    {mensaje.texto}
                  </ReactMarkdown>
                ) : (
                  cargando && "…"
                )}
              </div>
            )}
          </article>
        ))}
        {estado && <p className="text-sm text-zinc-400">{estado}</p>}
        {error && (
          <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
      </section>

      <form className="mx-auto flex w-full max-w-4xl gap-3 px-6 pb-6" onSubmit={enviar}>
        <label className="sr-only" htmlFor="mensaje">
          Mensaje
        </label>
        <textarea
          className="min-h-12 flex-1 resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-500"
          disabled={cargando}
          id="mensaje"
          onChange={(event) => setTexto(event.target.value)}
          onCompositionStart={() => {
            composicionActiva.current = true;
          }}
          onCompositionEnd={() => {
            composicionActiva.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
              return;
            }
            event.preventDefault();
            if (!composicionActiva.current && !cargando && texto.trim()) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Escribe un mensaje…"
          rows={1}
          value={texto}
        />
        <button
          className="self-end rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={cargando || !texto.trim()}
          type="submit"
        >
          {cargando ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}

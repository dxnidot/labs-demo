import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ListarModelos } from "../application/use-cases/ListarModelos";
import type { Mensaje } from "../domain/Mensaje";
import type { Modelo } from "../domain/Modelo";
import type { Usuario } from "../domain/Usuario";
import { adaptadores } from "../infrastructure/composition";
import { Button } from "./components/Button";
import { claseFoco, claseFocoContenedor } from "./components/foco";
import { AvisoProveedorModelo } from "./components/AvisoProveedorModelo";
import { Esqueleto, AvisoCarga } from "./components/Esqueleto";
import { EstadoError } from "./components/EstadoError";
import { LaraLogo } from "./components/LaraLogo";
import { PageLayout } from "./components/PageLayout";
import { PuntoEstado } from "./components/PuntoEstado";
import { SelectorModelo } from "./components/SelectorModelo";
import { modeloOrquestador } from "../domain/catalogoLab";
import { comportamientoDeScroll } from "./movimientoReducido";
import { useChatSessions } from "./useChatSessions";

const listarModelos = new ListarModelos(adaptadores.modelo);
const modelosDeRespaldo: Modelo[] = [
  { id: modeloOrquestador, nombre: modeloOrquestador.split("/")[1], tier: "basic" },
];

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
    <span className="inline-flex min-h-8 items-center gap-2 rounded-pill border border-border px-3 text-compact text-text-2">
      <PuntoEstado estado="ok" />
      Agente: orquestador
    </span>
  );
}

function BotonEnviar({ deshabilitado }: { deshabilitado: boolean }) {
  return (
    <button
      aria-label="Enviar"
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-button bg-accent text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 shell:size-10 ${claseFoco}`}
      disabled={deshabilitado}
      type="submit"
    >
      <ArrowUp aria-hidden="true" className="size-4.5" />
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
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (cabecera y composer fijos, conversación como único scroll), foco visible y avatar solo con la L.
 * @modified Daniel Tovar 2026-10-01 Agrega el selector de modelo de LLM en la cabecera.
 * @modified Daniel Tovar 2026-10-02 Logs de consola del catálogo cargado y del modelo elegido por envío.
 * @modified Daniel Tovar 2026-10-10 Aviso fijo de ADR-0007 junto al campo de mensaje.
 * @modified Daniel Tovar 2026-10-10 "Ir al final" respeta prefers-reduced-motion.
 * @modified Daniel Tovar 2026-10-10 Esqueleto al abrir una conversación y errores con reintento (abrir y enviar).
 * @modified Daniel Tovar 2026-10-10 Catálogo de domain/catalogoLab y catálogo de modelos desde el composition root.
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
  const [origenError, setOrigenError] = useState<"sesion" | "envio" | null>(null);
  const [intentoSesion, setIntentoSesion] = useState(0);
  const ultimoEnvio = useRef("");
  const [mostrarIrAlFinal, setMostrarIrAlFinal] = useState(false);
  const [modelos, setModelos] = useState<Modelo[]>(modelosDeRespaldo);
  const [modeloId, setModeloId] = useState(modelosDeRespaldo[0].id);
  const composicionActiva = useRef(false);
  const listaMensajesRef = useRef<HTMLDivElement>(null);
  const seguirAlFinal = useRef(true);

  useEffect(() => {
    let active = true;
    listarModelos
      .ejecutar()
      .then((disponibles) => {
        if (active && disponibles.length > 0) {
          console.info(
            `[modelo] catálogo cargado (${disponibles.length}): ${disponibles.map((m) => m.id).join(", ")}; default=${disponibles[0].id}`,
          );
          setModelos(disponibles);
          setModeloId(disponibles[0].id);
        }
      })
      .catch((reason: unknown) => {
        console.warn("[modelo] no se pudo cargar el catálogo; usando respaldo", reason);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMensajes([]);
      return;
    }

    let active = true;
    setError(null);
    setOrigenError(null);
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
          setOrigenError("sesion");
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
  }, [activeSessionId, obtenerSesion, intentoSesion]);

  useEffect(() => {
    const list = listaMensajesRef.current;
    if (list && seguirAlFinal.current) {
      list.scrollTop = list.scrollHeight;
      setMostrarIrAlFinal(false);
    }
  }, [mensajes, estado, cargandoSesion]);

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargando || cargandoSesion || composicionActiva.current) {
      return;
    }
    void enviarTexto(mensaje);
  }

  async function enviarTexto(mensaje: string) {
    ultimoEnvio.current = mensaje;
    setError(null);
    setOrigenError(null);
    setCargando(true);
    setTexto("");
    seguirAlFinal.current = true;
    setMensajes((actuales) => [
      ...actuales,
      { rol: "usuario", texto: mensaje, fecha: new Date() },
      { rol: "agente", texto: "", fecha: new Date() },
    ]);

    let receivedText = false;
    console.info(`[modelo] enviando mensaje con model=${modeloId}`);
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
        modeloId,
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
      setOrigenError("envio");
    } finally {
      setEstado("");
      setCargando(false);
    }
  }

  /** Reabre la conversación o reenvía el último mensaje (solo si el fallo no dejó una respuesta a medias). */
  const reintentar =
    origenError === "sesion"
      ? () => setIntentoSesion((actual) => actual + 1)
      : origenError === "envio" && mensajes.at(-1)?.rol === "usuario"
        ? () => {
            setMensajes((actuales) => actuales.slice(0, -1));
            void enviarTexto(ultimoEnvio.current);
          }
        : undefined;

  function desplazarAlFinal() {
    const list = listaMensajesRef.current;
    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior: comportamientoDeScroll() });
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
    <PageLayout
      cabecera={
        mensajes.length > 0 || cargandoSesion ? (
          <header className="flex h-15 items-center justify-between gap-4 border-b border-divider px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="m-0 truncate text-body font-medium">
                {sesionActiva?.titulo ?? "Nuevo chat"}
              </h1>
              <span className="whitespace-nowrap rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-xs text-muted">
                orquestador
              </span>
            </div>
            <SelectorModelo
              modelos={modelos}
              onCambiar={(id) => {
                console.info(`[modelo] seleccionado por el usuario: ${modeloId} -> ${id}`);
                setModeloId(id);
              }}
              seleccionado={modeloId}
            />
          </header>
        ) : undefined
      }
      contenidoClassName="px-4 py-6 sm:px-6 sm:py-8"
      contenidoProps={{
        "aria-label": "Conversación",
        "aria-live": "polite",
        onScroll: (event) => {
          const element = event.currentTarget;
          const alFinal = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
          seguirAlFinal.current = alFinal;
          setMostrarIrAlFinal(!alFinal);
        },
        role: "log",
      }}
      contenidoRef={listaMensajesRef}
      flotante={
        mostrarIrAlFinal ? (
          <Button
            className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
            onClick={desplazarAlFinal}
          >
            Ir al final ↓
          </Button>
        ) : undefined
      }
      libre
      pie={
        mensajes.length > 0 || cargandoSesion ? (
          <footer className="px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="mx-auto flex w-full max-w-190 flex-col gap-2.5">
              <form
                className={`flex flex-col gap-3 rounded-composer border border-border bg-surface py-3.5 pl-4 pr-3.5 ${claseFocoContenedor}`}
                onSubmit={enviar}
              >
                <label className="sr-only" htmlFor="mensaje-chat">
                  Mensaje para Lara
                </label>
                <textarea
                  className="w-full resize-none bg-transparent text-body text-text outline-none placeholder:text-faint"
                  disabled={cargando || cargandoSesion}
                  aria-describedby="aviso-proveedor-chat"
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
              <AvisoProveedorModelo id="aviso-proveedor-chat" />
              <p className="m-0 text-center text-xs text-faint">
                Lara puede equivocarse. Verifica los datos importantes.
              </p>
            </div>
          </footer>
        ) : undefined
      }
    >
      <div className="mx-auto flex min-h-full w-full max-w-190 flex-col gap-6">
        {mensajes.length === 0 && !cargandoSesion && (
          <div className="m-auto flex w-full max-w-190 flex-col gap-7 py-6">
            <div className="flex items-center gap-3.5">
              <LaraLogo tamano={36} />
              <h1 className="m-0 text-2xl font-medium tracking-tight sm:text-hero">
                Hola, {usuario.username}. ¿En qué te ayudo?
              </h1>
            </div>
            <form
              className={`flex flex-col gap-3 rounded-composer border border-border bg-surface p-4 ${claseFocoContenedor}`}
              onSubmit={enviar}
            >
              <label className="sr-only" htmlFor="mensaje">
                Mensaje para Lara
              </label>
              <textarea
                className="w-full resize-none bg-transparent text-body text-text outline-none placeholder:text-faint"
                disabled={cargando}
                aria-describedby="aviso-proveedor-inicio"
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
            <AvisoProveedorModelo className="-mt-3" id="aviso-proveedor-inicio" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 wide:grid-cols-4">
              {sugerencias.map((sugerencia) => (
                <button
                  className={`flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4 text-left text-sm transition-colors hover:border-border-strong hover:bg-surface-hover ${claseFoco}`}
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

        {cargandoSesion && (
          <>
            <AvisoCarga texto="Cargando conversación…" />
            <div aria-hidden="true" className="flex flex-col gap-6">
              <Esqueleto className="h-11 w-3/5 self-end" />
              <div className="flex gap-3.5">
                <Esqueleto className="size-7.5 shrink-0" />
                <div className="flex w-full flex-col gap-3">
                  <Esqueleto className="h-4 w-full" />
                  <Esqueleto className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          </>
        )}

        {mensajes.map((mensaje, index) => (
          <article
            className={
              mensaje.rol === "usuario"
                ? "max-w-4/5 self-end rounded-card bg-surface-active px-4 py-3 text-body"
                : "flex w-full gap-3.5 text-body leading-body"
            }
            key={`${mensaje.fecha.getTime()}-${index}`}
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
                    cargando && <span className="text-muted">…</span>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}

        {estado && <p className="mx-auto font-mono text-xs text-muted">{estado}</p>}
        {error && <EstadoError mensaje={error} onReintentar={reintentar} />}
      </div>
    </PageLayout>
  );
}

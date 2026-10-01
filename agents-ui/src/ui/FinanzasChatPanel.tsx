import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { ArrowUp, FileText, Paperclip, X } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ActualizacionStreaming } from "../application/ports/AgentePort";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { MovimientoImportacion, PreviewImportacion } from "../domain/ImportacionFinanciera";
import type { Mensaje } from "../domain/Mensaje";
import { Button } from "./components/Button";
import { claseFoco, claseFocoContenedor } from "./components/foco";
import { IconButton } from "./components/IconButton";
import { PageLayout } from "./components/PageLayout";
import { useChatSessions } from "./useChatSessions";
import { useTrampaFoco } from "./useTrampaFoco";

interface FinanzasChatPanelProps {
  abierto: boolean;
  drawer: boolean;
  finanzas: FinanzasPort;
  onCerrar: () => void;
  onImportConfirmed: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
}

interface ImportacionPendiente {
  nombre: string;
  preview: PreviewImportacion | null;
}

const etiquetaTipo = {
  GASTO: "Gasto",
  INGRESO: "Ingreso",
} as const;

const componentesMarkdown: Components = {
  p: ({ children }) => <p className="m-0">{children}</p>,
  ul: ({ children }) => <ul className="my-1 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal space-y-1 pl-5">{children}</ol>,
  code: ({ children }) => <code className="font-mono text-[13px] text-text">{children}</code>,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-surface px-3.5 py-2.5 font-medium text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3.5 py-3 text-text-2">{children}</td>
  ),
};

/**
 * Panel "Asistente de finanzas": chat con Markdown y adjuntar CSV con vista previa y confirmación.
 * El archivo viaja únicamente al puerto de Finanzas; el agente recibe solo texto.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Panel lateral plegable con composer y adjuntar archivo.
 * @modified Daniel Tovar 2026-09-30 Drawer modal bajo 980px con fondo, Escape y foco atrapado.
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout: cabecera y composer fijos, hilo como único scroll.
 */
export function FinanzasChatPanel({
  abierto,
  drawer,
  finanzas,
  onCerrar,
  onImportConfirmed,
  panelRef,
}: FinanzasChatPanelProps) {
  const {
    enviarMensaje,
    finanzasSessionId,
    obtenerSesion,
    refreshSessions,
    setFinanzasSessionId,
  } = useChatSessions();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estadoChat, setEstadoChat] = useState("");
  const [cargandoChat, setCargandoChat] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [errorChat, setErrorChat] = useState<string | null>(null);
  const [importacion, setImportacion] = useState<ImportacionPendiente | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [estadoImportacion, setEstadoImportacion] = useState("");
  const composicionActiva = useRef(false);
  const sesionCargada = useRef<string | null>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);
  const hilo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!finanzasSessionId) {
      sesionCargada.current = null;
      setMensajes([]);
      setCargandoSesion(false);
      return;
    }
    if (sesionCargada.current === finanzasSessionId) {
      return;
    }

    let activa = true;
    sesionCargada.current = finanzasSessionId;
    setErrorChat(null);
    setCargandoSesion(true);
    setMensajes([]);
    void obtenerSesion(finanzasSessionId)
      .then((mensajesSesion) => {
        if (activa) {
          setMensajes(mensajesSesion);
        }
      })
      .catch((reason: unknown) => {
        if (activa) {
          setErrorChat(
            reason instanceof Error ? reason.message : "No se pudo abrir la conversación.",
          );
        }
      })
      .finally(() => {
        if (activa) {
          setCargandoSesion(false);
        }
      });

    return () => {
      activa = false;
    };
  }, [finanzasSessionId, obtenerSesion]);

  useTrampaFoco(drawer && abierto, onCerrar, panelRef);

  useEffect(() => {
    const lista = hilo.current;
    if (lista) {
      lista.scrollTop = lista.scrollHeight;
    }
  }, [mensajes, importacion, estadoImportacion]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargandoChat || cargandoSesion || composicionActiva.current) {
      return;
    }

    setErrorChat(null);
    setCargandoChat(true);
    setTexto("");
    setMensajes((actuales) => [
      ...actuales,
      { rol: "usuario", texto: mensaje, fecha: new Date() },
      { rol: "agente", texto: "", fecha: new Date() },
    ]);

    let recibioTexto = false;
    try {
      const sessionId = await enviarMensaje(
        mensaje,
        finanzasSessionId,
        (update: ActualizacionStreaming) => {
          if (update.tipo === "herramienta") {
            setEstadoChat(`Consultando ${update.nombre}…`);
            return;
          }

          recibioTexto = true;
          setEstadoChat("");
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
        "finanzas",
      );
      sesionCargada.current = sessionId;
      setFinanzasSessionId(sessionId);
      if (!recibioTexto) {
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
      setErrorChat(
        reason instanceof Error ? reason.message : "No se pudo completar el mensaje.",
      );
    } finally {
      setEstadoChat("");
      setCargandoChat(false);
    }
  }

  async function adjuntar(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!archivo || confirmando) {
      return;
    }

    setErrorImportacion(null);
    setEstadoImportacion("");
    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setImportacion(null);
      setErrorImportacion("Selecciona un archivo con extensión .csv.");
      return;
    }

    setImportacion({ nombre: archivo.name, preview: null });
    try {
      const preview = await finanzas.previsualizarImportacion(archivo);
      setImportacion({ nombre: archivo.name, preview });
    } catch (reason: unknown) {
      setImportacion(null);
      setErrorImportacion(
        reason instanceof Error
          ? reason.message
          : "No se pudo previsualizar el archivo CSV.",
      );
    }
  }

  async function confirmarImportacion() {
    const preview = importacion?.preview;
    if (!preview || preview.totalRegistros === 0 || confirmando) {
      return;
    }

    setErrorImportacion(null);
    setConfirmando(true);
    try {
      const resultado = await finanzas.confirmarImportacion(preview.importId);
      setImportacion(null);
      setEstadoImportacion(`Importación confirmada: ${resultado.totalRegistros} registros.`);
      onImportConfirmed();
    } catch (reason: unknown) {
      setErrorImportacion(
        reason instanceof Error ? reason.message : "No se pudo confirmar la importación.",
      );
    } finally {
      setConfirmando(false);
    }
  }

  function descartarImportacion() {
    setImportacion(null);
    setErrorImportacion(null);
    setEstadoImportacion("");
  }

  const preview = importacion?.preview ?? null;

  return (
    <>
      {drawer && abierto && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-bg/70"
          data-testid="fondo-asistente"
          onClick={onCerrar}
        />
      )}
      <div
        aria-label="Asistente de finanzas"
        aria-modal={drawer ? true : undefined}
        className={`flex w-96 shrink-0 flex-col border-l border-border bg-surface outline-none ${
          drawer ? "fixed inset-y-0 right-0 z-30 max-w-full" : "h-full"
        }`}
        hidden={!abierto}
        ref={panelRef}
        role={drawer ? "dialog" : "complementary"}
        tabIndex={-1}
      >
        <PageLayout
          cabecera={
            <header className="flex h-15 shrink-0 items-center justify-between gap-2 border-b border-border pl-4.5 pr-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="m-0 text-[15px] font-semibold">Asistente de finanzas</h2>
                <span className="font-mono text-[11px] text-faint">
                  agente finanzas · confirma antes de guardar
                </span>
              </div>
              <IconButton
                aria-label="Cerrar asistente"
                onClick={onCerrar}
                tamano="compacto"
                tono="atenuado"
              >
                <X aria-hidden="true" className="size-4.5" />
              </IconButton>
            </header>
          }
          contenidoProps={{
            "aria-busy": cargandoSesion || cargandoChat,
            "aria-label": "Conversación con el asistente financiero",
            "aria-live": "polite",
            role: "log",
          }}
          contenidoRef={hilo}
          libre
          pie={
            <div className="shrink-0 border-t border-border px-3.5 pb-3.5 pt-3">
              <form
                className={`flex flex-col gap-2 rounded-composer border border-border bg-bg py-2.5 pl-3 pr-2.5 ${claseFocoContenedor}`}
                onSubmit={enviar}
              >
                <label className="sr-only" htmlFor="mensaje-finanzas">
                  Mensaje para el asistente de finanzas
                </label>
                <textarea
                  className="w-full resize-none bg-transparent text-sm text-text outline-none placeholder:text-faint"
                  disabled={cargandoChat || cargandoSesion}
                  id="mensaje-finanzas"
                  onChange={(event) => setTexto(event.target.value)}
                  onCompositionEnd={() => {
                    composicionActiva.current = false;
                  }}
                  onCompositionStart={() => {
                    composicionActiva.current = true;
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                      return;
                    }
                    event.preventDefault();
                    if (!composicionActiva.current && !cargandoChat && texto.trim()) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Pregunta, registra un gasto o adjunta un archivo…"
                  rows={2}
                  value={texto}
                />
                <div className="flex items-center gap-1.5">
                  <input
                    accept=".csv,text/csv"
                    aria-label="Archivo CSV"
                    className="hidden"
                    onChange={(event) => void adjuntar(event)}
                    ref={entradaArchivo}
                    type="file"
                  />
                  <IconButton
                    aria-label="Adjuntar archivo"
                    disabled={confirmando}
                    onClick={() => entradaArchivo.current?.click()}
                    tamano="compacto"
                    type="button"
                  >
                    <Paperclip aria-hidden="true" className="size-4.5" />
                  </IconButton>
                  <span className="flex-1 text-[11px] text-faint">
                    CSV · se procesa en finanzas
                  </span>
                  <button
                    aria-label="Enviar"
                    className={`inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 min-[980px]:size-10 ${claseFoco}`}
                    disabled={!texto.trim() || cargandoChat || cargandoSesion}
                    type="submit"
                  >
                    <ArrowUp aria-hidden="true" className="size-4.5" />
                  </button>
                </div>
              </form>
            </div>
          }
        >
          <div className="flex flex-col gap-4 p-4.5">
            {cargandoSesion && (
              <p className="m-0 text-sm text-muted" role="status">Cargando conversación…</p>
            )}
            {mensajes.length === 0 && !cargandoSesion && !importacion && (
              <p className="m-0 text-sm text-muted">
                Pregunta sobre tus finanzas o adjunta un CSV. El archivo no se envía al agente.
              </p>
            )}
            {mensajes.map((mensaje, index) =>
              mensaje.rol === "usuario" ? (
                <article
                  className="max-w-[88%] self-end whitespace-pre-wrap rounded-[14px] bg-surface-active px-3.5 py-2.5 text-sm leading-normal"
                  key={`${mensaje.fecha.getTime()}-${index}`}
                >
                  <p className="sr-only">Tú</p>
                  {mensaje.texto}
                </article>
              ) : (
                <article
                  className="flex flex-col gap-2.5 wrap-break-word text-sm leading-[1.55] text-text"
                  key={`${mensaje.fecha.getTime()}-${index}`}
                >
                  <p className="sr-only">Lara</p>
                  {mensaje.texto ? (
                    <ReactMarkdown components={componentesMarkdown} remarkPlugins={[remarkGfm]}>
                      {mensaje.texto}
                    </ReactMarkdown>
                  ) : (
                    cargandoChat && <span className="text-muted">…</span>
                  )}
                </article>
              ),
            )}

            {importacion && (
              <div className="flex flex-col gap-2.5">
                <div className="inline-flex items-center gap-2 self-end rounded-[10px] border border-border bg-bg px-3 py-2 text-[13px]">
                  <FileText aria-hidden="true" className="size-4 text-accent" />
                  <span className="font-mono">{importacion.nombre}</span>
                </div>
                {!preview && (
                  <p className="m-0 text-sm text-muted" role="status">Previsualizando…</p>
                )}
                {preview && (
                  <div className="flex flex-col gap-2.5 text-sm leading-[1.55]">
                    <p className="m-0">
                      Finanzas leyó <span className="font-mono">{preview.totalRegistros}</span>{" "}
                      movimientos del archivo, sin pasarlo por el modelo. Todavía{" "}
                      <strong>no se ha guardado nada</strong>:
                    </p>
                    {preview.movimientos.length === 0 ? (
                      <p className="m-0 text-muted">No hay filas para previsualizar.</p>
                    ) : (
                      <TablaPreview movimientos={preview.movimientos} />
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="min-h-9"
                        disabled={
                          preview.totalRegistros === 0 ||
                          preview.movimientos.length === 0 ||
                          confirmando
                        }
                        onClick={() => void confirmarImportacion()}
                        type="button"
                        variant="primary"
                      >
                        {confirmando ? "Confirmando…" : `Confirmar las ${preview.totalRegistros}`}
                      </Button>
                      <Button
                        className="min-h-9 rounded-pill"
                        disabled={confirmando}
                        onClick={descartarImportacion}
                        type="button"
                      >
                        Descartar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {estadoImportacion && (
              <p className="m-0 text-sm text-ok" role="status">{estadoImportacion}</p>
            )}
            {errorImportacion && (
              <p className="m-0 text-sm text-danger" role="alert">{errorImportacion}</p>
            )}
            {estadoChat && <p className="m-0 text-xs text-muted" role="status">{estadoChat}</p>}
            {errorChat && <p className="m-0 text-sm text-danger" role="alert">{errorChat}</p>}
          </div>
        </PageLayout>
      </div>
    </>
  );
}

interface TablaPreviewProps {
  movimientos: MovimientoImportacion[];
}

function TablaPreview({ movimientos }: TablaPreviewProps) {
  return (
    <div className="max-h-64 shrink-0 overflow-auto rounded-[10px] border border-border">
      <table className="w-full min-w-105 border-collapse text-left text-xs">
        <caption className="sr-only">Previsualización de movimientos</caption>
        <thead className="sticky top-0 bg-surface text-muted">
          <tr>
            <th className="px-3 py-2 font-medium" scope="col">fecha</th>
            <th className="px-3 py-2 font-medium" scope="col">comercio</th>
            <th className="px-3 py-2 font-medium" scope="col">categoría</th>
            <th className="px-3 py-2 font-medium" scope="col">tipo</th>
            <th className="px-3 py-2 text-right font-medium" scope="col">monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento, index) => (
            <tr
              className="border-t border-divider text-text-2"
              key={`${movimiento.fecha}-${index}`}
            >
              <td className="px-3 py-2 font-mono">{movimiento.fecha}</td>
              <th className="px-3 py-2 text-left font-normal" scope="row">
                {movimiento.comercio}
              </th>
              <td className="px-3 py-2">{movimiento.categoria}</td>
              <td className="px-3 py-2">{etiquetaTipo[movimiento.tipo]}</td>
              <td className="px-3 py-2 text-right font-mono">
                {movimiento.monto} {movimiento.moneda}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, FileUp } from "lucide-react";
import type { ActualizacionStreaming } from "../application/ports/AgentePort";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { MovimientoImportacion, PreviewImportacion } from "../domain/ImportacionFinanciera";
import type { Mensaje } from "../domain/Mensaje";
import { Button } from "./components/Button";
import { useChatSessions } from "./useChatSessions";

interface FinanzasChatPanelProps {
  finanzas: FinanzasPort;
  onImportConfirmed: () => void;
}

const etiquetaTipo = {
  GASTO: "Gasto",
  INGRESO: "Ingreso",
} as const;

/**
 * Reúne el chat financiero y la importación CSV con confirmación explícita.
 * El archivo viaja únicamente al puerto de Finanzas; el chat recibe solo texto.
 * @author Daniel
 * @since 2026-09-30
 */
export function FinanzasChatPanel({
  finanzas,
  onImportConfirmed,
}: FinanzasChatPanelProps) {
  const {
    activeSessionId,
    enviarMensaje,
    obtenerSesion,
    refreshSessions,
    setActiveSessionId,
  } = useChatSessions();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estadoChat, setEstadoChat] = useState("");
  const [cargandoChat, setCargandoChat] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(false);
  const [errorChat, setErrorChat] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacion | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [importacionConfirmada, setImportacionConfirmada] = useState(false);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [estadoImportacion, setEstadoImportacion] = useState("");
  const composicionActiva = useRef(false);

  useEffect(() => {
    if (!activeSessionId) {
      setMensajes([]);
      setCargandoSesion(false);
      setErrorChat(null);
      return;
    }

    let activa = true;
    setErrorChat(null);
    setCargandoSesion(true);
    setMensajes([]);
    void obtenerSesion(activeSessionId)
      .then((mensajesSesion) => {
        if (activa) {
          setMensajes(mensajesSesion);
        }
      })
      .catch((reason: unknown) => {
        if (activa) {
          setErrorChat(
            reason instanceof Error
              ? reason.message
              : "No se pudo abrir la conversación.",
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
  }, [activeSessionId, obtenerSesion]);

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
        activeSessionId,
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
      );
      setActiveSessionId(sessionId);
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

  async function previsualizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!archivo || cargandoPreview || confirmando) {
      return;
    }
    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setPreview(null);
      setErrorImportacion("Selecciona un archivo con extensión .csv.");
      return;
    }

    setPreview(null);
    setErrorImportacion(null);
    setEstadoImportacion("");
    setImportacionConfirmada(false);
    setCargandoPreview(true);
    try {
      setPreview(await finanzas.previsualizarImportacion(archivo));
    } catch (reason: unknown) {
      setErrorImportacion(
        reason instanceof Error
          ? reason.message
          : "No se pudo previsualizar el archivo CSV.",
      );
    } finally {
      setCargandoPreview(false);
    }
  }

  async function confirmarImportacion() {
    if (
      !preview ||
      preview.totalRegistros === 0 ||
      preview.movimientos.length === 0 ||
      confirmando ||
      importacionConfirmada
    ) {
      return;
    }

    setErrorImportacion(null);
    setEstadoImportacion("");
    setConfirmando(true);
    try {
      const resultado = await finanzas.confirmarImportacion(preview.importId);
      setImportacionConfirmada(true);
      setEstadoImportacion(
        `Importación confirmada: ${resultado.totalRegistros} registros.`,
      );
      onImportConfirmed();
    } catch (reason: unknown) {
      setErrorImportacion(
        reason instanceof Error
          ? reason.message
          : "No se pudo confirmar la importación.",
      );
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <section
      aria-labelledby="asistente-finanzas-titulo"
      className="mb-8 rounded-card border border-border bg-surface"
    >
      <header className="border-b border-divider px-5 py-4 min-[640px]:px-6">
        <h2 className="text-lg font-semibold" id="asistente-finanzas-titulo">
          Asistente de finanzas
        </h2>
        <p className="mt-1 text-sm text-muted">
          Chatea con Lara o previsualiza una importación. El archivo solo se envía al servicio de Finanzas.
        </p>
      </header>

      <div className="grid gap-6 p-5 min-[640px]:p-6 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section aria-labelledby="chat-finanzas-titulo" className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold" id="chat-finanzas-titulo">
            Chat
          </h3>
          <div
            aria-busy={cargandoSesion || cargandoChat}
            aria-label="Conversación con el asistente financiero"
            aria-live="polite"
            className="mb-3 max-h-72 min-h-28 space-y-3 overflow-y-auto rounded-button border border-border bg-bg p-3"
            role="log"
          >
            {cargandoSesion && (
              <p className="text-sm text-muted" role="status">Cargando conversación…</p>
            )}
            {mensajes.length === 0 && !cargandoSesion && (
              <p className="text-sm text-muted">
                Pregunta sobre tus finanzas. Adjuntar un CSV no lo envía al chat.
              </p>
            )}
            {mensajes.map((mensaje, index) => (
              <article
                className={
                  mensaje.rol === "usuario"
                    ? "ml-auto max-w-[90%] rounded-button bg-surface-active px-3 py-2 text-sm"
                    : "mr-auto max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm text-text-2"
                }
                key={`${mensaje.fecha.getTime()}-${index}`}
              >
                <p className="sr-only">{mensaje.rol === "usuario" ? "Tú" : "Lara"}</p>
                {mensaje.texto || (cargandoChat && mensaje.rol === "agente" ? "…" : "")}
              </article>
            ))}
          </div>
          {estadoChat && (
            <p className="mb-3 text-xs text-muted" role="status">{estadoChat}</p>
          )}
          {errorChat && (
            <p className="mb-3 text-sm text-pink" role="alert">{errorChat}</p>
          )}
          <form className="rounded-button border border-border bg-bg p-3" onSubmit={enviar}>
            <label className="sr-only" htmlFor="mensaje-finanzas">
              Mensaje para Lara
            </label>
            <textarea
              className="min-h-16 w-full resize-y bg-transparent px-2 py-1 text-sm text-text outline-none placeholder:text-muted"
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
                if (
                  event.key !== "Enter" ||
                  event.shiftKey ||
                  event.nativeEvent.isComposing
                ) {
                  return;
                }
                event.preventDefault();
                if (!composicionActiva.current && !cargandoChat && texto.trim()) {
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Escribe un mensaje…"
              rows={2}
              value={texto}
            />
            <div className="mt-2 flex justify-end">
              <Button
                disabled={!texto.trim() || cargandoChat || cargandoSesion}
                variant="primary"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
                Enviar
              </Button>
            </div>
          </form>
        </section>

        <section aria-labelledby="importacion-csv-titulo" className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold" id="importacion-csv-titulo">
            Importar CSV
          </h3>
          <form className="space-y-3" onSubmit={(event) => void previsualizar(event)}>
            <label className="block text-sm text-text-2" htmlFor="archivo-finanzas-csv">
              Archivo CSV
            </label>
            <input
              accept=".csv,text/csv"
              className="block min-h-11 w-full rounded-button border border-border bg-bg px-3 py-2 text-sm text-text file:mr-3 file:rounded-button file:border-0 file:bg-surface-hover file:px-3 file:py-1 file:text-text"
              disabled={cargandoPreview || confirmando}
              id="archivo-finanzas-csv"
              onChange={(event) => {
                setArchivo(event.currentTarget.files?.[0] ?? null);
                setPreview(null);
                setImportacionConfirmada(false);
                setErrorImportacion(null);
                setEstadoImportacion("");
              }}
              type="file"
            />
            <p className="text-xs leading-relaxed text-muted">
              Columnas: fecha, monto, moneda, comercio, categoria, tarjetaId, tipo.
            </p>
            <Button
              disabled={!archivo || cargandoPreview || confirmando}
              type="submit"
              variant="ghost"
            >
              <FileUp aria-hidden="true" className="size-4" />
              {cargandoPreview ? "Previsualizando…" : "Previsualizar CSV"}
            </Button>
          </form>

          {errorImportacion && (
            <p className="mt-3 text-sm text-pink" role="alert">{errorImportacion}</p>
          )}
          {estadoImportacion && (
            <p className="mt-3 text-sm text-ok" role="status">{estadoImportacion}</p>
          )}
          {preview && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium">
                Previsualización · {preview.totalRegistros} registros
              </h4>
              {preview.movimientos.length === 0 ? (
                <p className="text-sm text-muted">No hay filas para previsualizar.</p>
              ) : (
                <TablaPreview movimientos={preview.movimientos} />
              )}
              <Button
                disabled={
                  preview.totalRegistros === 0 ||
                  preview.movimientos.length === 0 ||
                  confirmando ||
                  importacionConfirmada
                }
                onClick={() => void confirmarImportacion()}
                type="button"
                variant="primary"
              >
                {confirmando ? "Confirmando…" : "Confirmar importación"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

interface TablaPreviewProps {
  movimientos: MovimientoImportacion[];
}

function TablaPreview({ movimientos }: TablaPreviewProps) {
  return (
    <div className="max-h-64 overflow-auto rounded-button border border-border">
      <table className="w-full min-w-[560px] border-collapse text-left text-xs">
        <caption className="sr-only">Previsualización de movimientos</caption>
        <thead className="sticky top-0 bg-surface text-muted">
          <tr>
            <th className="px-3 py-2 font-medium" scope="col">Fecha</th>
            <th className="px-3 py-2 font-medium" scope="col">Comercio</th>
            <th className="px-3 py-2 font-medium" scope="col">Categoría</th>
            <th className="px-3 py-2 font-medium" scope="col">Tarjeta</th>
            <th className="px-3 py-2 font-medium" scope="col">Tipo</th>
            <th className="px-3 py-2 text-right font-medium" scope="col">Monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento, index) => (
            <tr
              className="border-t border-divider text-text-2"
              key={`${movimiento.fecha}-${index}`}
            >
              <td className="px-3 py-2">{movimiento.fecha}</td>
              <th className="px-3 py-2 text-left font-medium" scope="row">
                {movimiento.comercio}
              </th>
              <td className="px-3 py-2">{movimiento.categoria}</td>
              <td className="px-3 py-2">{movimiento.tarjetaId ?? "—"}</td>
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

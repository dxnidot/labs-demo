import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ListarModelos } from "../application/use-cases/ListarModelos";
import type { Mensaje } from "../domain/Mensaje";
import type { Modelo } from "../domain/Modelo";
import type { Usuario } from "../domain/Usuario";
import { adaptadores } from "../infrastructure/composition";
import { agregarOActualizarPaso, agregarOActualizarTexto } from "./chatEventos";
import { Button } from "./components/Button";
import { claseFoco } from "./components/foco";
import { AvisoProveedorModelo } from "./components/AvisoProveedorModelo";
import { Esqueleto, AvisoCarga } from "./components/Esqueleto";
import { EstadoError } from "./components/EstadoError";
import { LaraLogo } from "./components/LaraLogo";
import { PageLayout } from "./components/PageLayout";
import { SelectorModelo } from "./components/SelectorModelo";
import { modeloOrquestador } from "../domain/catalogoLab";
import { ComposerChat } from "./ComposerChat";
import { MensajeConversacion, MensajeEvento } from "./MensajeChat";
import { comportamientoDeScroll } from "./movimientoReducido";
import { useChatSessions } from "./useChatSessions";

const listarModelos = new ListarModelos(adaptadores.modelo);
const modelosDeRespaldo: Modelo[] = [
  { id: modeloOrquestador, nombre: modeloOrquestador.split("/")[1], tier: "basic" },
];

const sugerencias = [
  "¿Cuánto llevo en gastos este mes?",
  "¿Cuáles son mis próximos pagos de tarjeta?",
  "Muéstrame el resumen financiero del mes",
  "¿Me conviene pagar el total o el mínimo de mi tarjeta?",
];

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
 * @modified Daniel Tovar 2026-10-10 El estado inicial arranca arriba (antes bajaba el scroll al final y ocultaba el saludo a 320px).
 * @modified Daniel Tovar 2026-10-10 Catálogo de domain/catalogoLab y catálogo de modelos desde el composition root.
 * @modified Daniel Tovar 2026-10-10 Eventos A2A y pasos del flujo determinista como mensajes "evento" (mockup 04).
 * @modified Daniel Tovar 2026-11-19 Composer y mensajes en componentes propios (mensajes memoizados), adjuntar deshabilitado, cancelación del streaming al salir y aviso accesible al terminar.
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
  const [anuncio, setAnuncio] = useState("");
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
  const envioEnCurso = useRef<AbortController | null>(null);

  useEffect(() => {
    // Al salir del chat se corta el streaming en curso: no se sigue leyendo ni actualizando estado.
    return () => envioEnCurso.current?.abort();
  }, []);

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
    if (!list) {
      return;
    }
    if (mensajes.length === 0) {
      // Estado inicial (saludo, campo y sugerencias): arranca arriba, no al final del contenido.
      list.scrollTop = 0;
      return;
    }
    if (seguirAlFinal.current) {
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
    const controlador = new AbortController();
    envioEnCurso.current = controlador;
    ultimoEnvio.current = mensaje;
    setError(null);
    setOrigenError(null);
    setAnuncio("");
    setCargando(true);
    setTexto("");
    seguirAlFinal.current = true;
    setMensajes((actuales) => [...actuales, { rol: "usuario", texto: mensaje, fecha: new Date() }]);

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
          if (update.tipo === "a2a") {
            setEstado("");
            setMensajes((actuales) => [
              ...actuales,
              {
                rol: "evento",
                texto: `${update.origen} → ${update.destino} · A2A · ${update.modo}`,
                fecha: new Date(),
                pasos: [],
              },
            ]);
            return;
          }
          if (update.tipo === "paso") {
            setMensajes((actuales) => agregarOActualizarPaso(actuales, update));
            return;
          }

          receivedText = true;
          setEstado("");
          setMensajes((actuales) => agregarOActualizarTexto(actuales, update));
        },
        modeloId,
        undefined,
        controlador.signal,
      );
      setActiveSessionId(sentSessionId);
      if (!receivedText) {
        throw new Error("El agente terminó el flujo sin una respuesta de texto.");
      }
      setAnuncio("Lara respondió.");
      await refreshSessions();
    } catch (reason: unknown) {
      if (controlador.signal.aborted) {
        return;
      }
      setMensajes((actuales) => {
        const ultimo = actuales.at(-1);
        return ultimo?.rol === "agente" && ultimo.texto.length === 0 ? actuales.slice(0, -1) : actuales;
      });
      setError(reason instanceof Error ? reason.message : "No se pudo completar el mensaje.");
      setOrigenError("envio");
    } finally {
      if (!controlador.signal.aborted) {
        setEstado("");
        setCargando(false);
      }
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

  function alCambiarComposicion(activa: boolean) {
    composicionActiva.current = activa;
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
        // Durante el streaming no se anuncia cada fragmento; al terminar avisa la región de estado.
        "aria-live": cargando ? "off" : "polite",
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
              <ComposerChat
                campoDeshabilitado={cargando || cargandoSesion}
                className="flex flex-col gap-3 rounded-composer border border-border bg-surface py-3.5 pl-4 pr-3.5"
                envioDeshabilitado={cargando || cargandoSesion || !texto.trim()}
                idAviso="aviso-proveedor-chat"
                idCampo="mensaje-chat"
                onCambiar={setTexto}
                onComposicion={alCambiarComposicion}
                onEnviar={enviar}
                onKeyDown={alPulsarTecla}
                placeholder="Escribe a Lara…"
                rows={2}
                texto={texto}
              />
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
            <ComposerChat
              campoDeshabilitado={cargando}
              className="flex flex-col gap-3 rounded-composer border border-border bg-surface p-4"
              envioDeshabilitado={cargando || !texto.trim()}
              idAviso="aviso-proveedor-inicio"
              idCampo="mensaje"
              onCambiar={setTexto}
              onComposicion={alCambiarComposicion}
              onEnviar={enviar}
              onKeyDown={alPulsarTecla}
              placeholder="Pregunta por tus gastos, tus tarjetas o tu calendario de pagos…"
              rows={3}
              texto={texto}
            />
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

        {mensajes.map((mensaje, index) => {
          const clave = `${mensaje.fecha.getTime()}-${index}`;
          return mensaje.rol === "evento" ? (
            <MensajeEvento key={clave} mensaje={mensaje} />
          ) : (
            <MensajeConversacion
              key={clave}
              mensaje={mensaje}
              pendiente={cargando && index === mensajes.length - 1}
            />
          );
        })}

        {estado && <p className="mx-auto font-mono text-xs text-muted">{estado}</p>}
        <p aria-live="polite" className="sr-only">
          {anuncio}
        </p>
        {error && <EstadoError mensaje={error} onReintentar={reintentar} />}
      </div>
    </PageLayout>
  );
}

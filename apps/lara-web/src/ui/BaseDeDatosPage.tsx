import { useEffect, useState } from "react";
import { ListarSesiones } from "../application/use-cases/ListarSesiones";
import type { SesionChat } from "../domain/SesionChat";
import type { Usuario } from "../domain/Usuario";
import { adaptadores } from "../infrastructure/composition";
import { AvisoCarga, EsqueletoTabla } from "./components/Esqueleto";
import { EstadoError } from "./components/EstadoError";
import { EstadoVacio } from "./components/EstadoVacio";
import { claseFocoInterno } from "./components/foco";
import { PageLayout } from "./components/PageLayout";
import { Pill } from "./components/Pill";
import { alPulsarTeclaEnPestanas } from "./pestanasTeclado";
import { useScrollPestanaActiva } from "./useScrollPestanaActiva";

const listarSesiones = new ListarSesiones(adaptadores.agente);
const tablas = ["sessions", "events", "app_states", "user_states"] as const;
type Tabla = (typeof tablas)[number];
const columnas = ["id", "título", "origen", "última actualización"];
const celda = "border-b border-border px-3.5 py-3 text-text-2";

function abreviar(id: string): string {
  return id.length > 9 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}

function formatearFecha(fecha: Date): string {
  const dos = (valor: number) => String(valor).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/**
 * Pantalla "Base de datos": sesiones reales del usuario desde la API de ADK, solo lectura.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Pestañas de tablas con flechas, tabindex itinerante y relación tab-panel.
 * @modified Daniel Tovar 2026-10-10 Adaptador desde el composition root (VITE_USE_MOCKS).
 * @modified Daniel Tovar 2026-10-10 Esqueleto de carga, vacíos sin jerga y error con reintento.
 */
export function BaseDeDatosPage({ usuario }: { usuario: Usuario }) {
  const [tabla, setTabla] = useState<Tabla>("sessions");
  const [sesiones, setSesiones] = useState<SesionChat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const listaTablas = useScrollPestanaActiva(tabla);

  useEffect(() => {
    let activo = true;
    listarSesiones
      .ejecutar(usuario.id)
      .then((lista) => {
        if (activo) {
          setSesiones(lista);
        }
      })
      .catch((reason: unknown) => {
        if (activo) {
          setError(reason instanceof Error ? reason.message : "No se pudieron leer las sesiones.");
        }
      });
    return () => {
      activo = false;
    };
  }, [usuario.id, intento]);

  function reintentar() {
    setError(null);
    setSesiones(null);
    setIntento((actual) => actual + 1);
  }

  return (
    <PageLayout
      pestanas={
        <>
          <div className="flex flex-wrap gap-2">
            <Pill contorno mono>
              ADK API server · sessions
            </Pill>
            <Pill mono tone="warn">
              Solo lectura
            </Pill>
          </div>

          <div
            aria-label="Tablas"
            className="flex shrink-0 gap-1 overflow-x-auto"
            onKeyDown={alPulsarTeclaEnPestanas}
            ref={listaTablas}
            role="tablist"
          >
            {tablas.map((nombre) => (
              <button
                aria-controls="panel-tablas"
                aria-selected={tabla === nombre}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-button px-3.5 font-mono text-compact shell:min-h-9 ${claseFocoInterno} ${
                  tabla === nombre ? "bg-surface-active text-text" : "text-muted"
                }`}
                id={`pestana-tabla-${nombre}`}
                key={nombre}
                onClick={() => setTabla(nombre)}
                role="tab"
                tabIndex={tabla === nombre ? 0 : -1}
                type="button"
              >
                {nombre}
              </button>
            ))}
          </div>
        </>
      }
      subtitulo="Sesiones, eventos y estado que guarda el orquestador."
      titulo="Base de datos"
    >
      <div aria-labelledby={`pestana-tabla-${tabla}`} id="panel-tablas" role="tabpanel">
        {tabla !== "sessions" && (
          <EstadoVacio mensaje="Esta tabla aún no se puede consultar desde Lara." />
        )}
        {tabla === "sessions" && error && <EstadoError mensaje={error} onReintentar={reintentar} />}
        {tabla === "sessions" && !error && sesiones === null && (
          <>
            <AvisoCarga texto="Cargando sesiones…" />
            <EsqueletoTabla />
          </>
        )}
        {tabla === "sessions" && sesiones?.length === 0 && (
          <EstadoVacio mensaje="Todavía no hay sesiones guardadas." />
        )}
        {tabla === "sessions" && sesiones && sesiones.length > 0 && (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-120 border-collapse font-mono text-compact">
              <thead>
                <tr>
                  {columnas.map((columna) => (
                    <th
                      className="border-b border-border bg-surface px-3.5 py-2.5 text-left font-medium text-muted"
                      key={columna}
                      scope="col"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sesiones.map((sesion) => (
                  <tr key={sesion.id}>
                    <td className={celda}>{abreviar(sesion.id)}</td>
                    <td className={celda}>{sesion.titulo}</td>
                    <td className={celda}>{sesion.origen}</td>
                    <td className={celda}>{formatearFecha(sesion.actualizado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

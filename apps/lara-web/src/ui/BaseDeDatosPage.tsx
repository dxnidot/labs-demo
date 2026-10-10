import { useEffect, useState } from "react";
import { ListarSesiones } from "../application/use-cases/ListarSesiones";
import type { SesionChat } from "../domain/SesionChat";
import type { Usuario } from "../domain/Usuario";
import { AdkAgenteAdapter } from "../infrastructure/adapters/AdkAgenteAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { EstadoVacio } from "./components/EstadoVacio";
import { claseFocoInterno } from "./components/foco";
import { PageLayout } from "./components/PageLayout";
import { useScrollPestanaActiva } from "./useScrollPestanaActiva";

const listarSesiones = new ListarSesiones(new AdkAgenteAdapter(keycloakAuthAdapter));
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
 */
export function BaseDeDatosPage({ usuario }: { usuario: Usuario }) {
  const [tabla, setTabla] = useState<Tabla>("sessions");
  const [sesiones, setSesiones] = useState<SesionChat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  }, [usuario.id]);

  return (
    <PageLayout
      pestanas={
        <>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-pill border border-border px-3 py-1.5 font-mono text-xs text-text-2">
              ADK API server · sessions
            </span>
            <span className="rounded-pill bg-surface-active px-3 py-1.5 font-mono text-xs text-warn">
              Solo lectura
            </span>
          </div>

          <div
            aria-label="Tablas"
            className="flex shrink-0 gap-1 overflow-x-auto"
            ref={listaTablas}
            role="tablist"
          >
            {tablas.map((nombre) => (
              <button
                aria-selected={tabla === nombre}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-[8px] px-3.5 font-mono text-[13px] min-[980px]:min-h-9 ${claseFocoInterno} ${
                  tabla === nombre ? "bg-surface-active text-text" : "text-muted"
                }`}
                key={nombre}
                onClick={() => setTabla(nombre)}
                role="tab"
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
      <div role="tabpanel">
        {tabla !== "sessions" && (
          <EstadoVacio fuente={`ADK API server · tabla ${tabla}`} pendiente="AG-05" />
        )}
        {tabla === "sessions" && error && (
          <p className="m-0 text-sm text-danger" role="alert">{error}</p>
        )}
        {tabla === "sessions" && !error && sesiones === null && (
          <p className="m-0 text-sm text-muted" role="status">Cargando sesiones…</p>
        )}
        {tabla === "sessions" && sesiones?.length === 0 && (
          <EstadoVacio fuente="ADK API server · sesiones del usuario" pendiente="AG-05" />
        )}
        {tabla === "sessions" && sesiones && sesiones.length > 0 && (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-120 border-collapse font-mono text-[13px]">
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

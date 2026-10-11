import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { MemoriaPort } from "../application/ports/MemoriaPort";
import type { ColeccionMemoria, ResultadoMemoria } from "../domain/ResultadoMemoria";
import { Button } from "./components/Button";
import { EstadoError } from "./components/EstadoError";
import { EstadoVacio } from "./components/EstadoVacio";
import { AvisoCarga, Esqueleto } from "./components/Esqueleto";
import { PageLayout } from "./components/PageLayout";
import { claseFoco } from "./components/foco";

interface MemoriaPageProps {
  memoria: MemoriaPort;
}

const consultaInicial = "configurar PKCE en un cliente público";

/** Presenta búsqueda, filtros y fragmentos recuperados por el servicio de memoria.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Conecta búsqueda y filtros al puerto de memoria con estados de carga, vacío y error.
 */
export function MemoriaPage({ memoria }: MemoriaPageProps) {
  const [consulta, setConsulta] = useState(consultaInicial);
  const [colecciones, setColecciones] = useState<ColeccionMemoria[]>([]);
  const [resultados, setResultados] = useState<ResultadoMemoria[]>([]);
  const [coleccionActiva, setColeccionActiva] = useState<string | undefined>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  async function ejecutarBusqueda(texto = consulta, filtro = coleccionActiva) {
    setCargando(true);
    setError(false);
    try {
      const [opciones, coincidencias] = await Promise.all([
        memoria.listarColecciones(),
        memoria.buscar(texto, filtro),
      ]);
      setColecciones(opciones);
      setResultados(coincidencias);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void ejecutarBusqueda("", undefined);
  }, [memoria]);

  function enviarBusqueda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void ejecutarBusqueda();
  }

  function cambiarColeccion(clave?: string) {
    setColeccionActiva(clave);
    void ejecutarBusqueda(consulta, clave);
  }

  return (
    <PageLayout
      subtitulo="Busca por significado en la documentación y en lo que Lara recuerda de tus sesiones."
      titulo="Memoria vectorizada"
    >
      <form
        aria-label="Buscar en memoria"
        className="flex min-h-13 items-center gap-3 rounded-card border border-border bg-surface px-4"
        onSubmit={enviarBusqueda}
      >
        <label className="sr-only" htmlFor="consulta-memoria">Buscar en memoria</label>
        <input
          className={`min-h-11 min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted ${claseFoco}`}
          id="consulta-memoria"
          onChange={(evento) => setConsulta(evento.currentTarget.value)}
          placeholder="¿Qué quieres encontrar?"
          type="search"
          value={consulta}
        />
        <Button disabled={cargando} type="submit" variant="primary">Buscar</Button>
      </form>

      <div aria-label="Filtrar por colección" className="flex flex-wrap gap-2" role="group">
        {[{ clave: undefined, nombre: "Todas" }, ...colecciones].map((coleccion) => {
          const activa = coleccion.clave === coleccionActiva;
          return (
            <button
              aria-pressed={activa}
              className={`min-h-11 rounded-pill border px-4 text-sm ${claseFoco} ${activa ? "border-surface-active bg-surface-active text-text" : "border-border bg-transparent text-text-2 hover:bg-surface-hover"}`}
              key={coleccion.clave ?? "todas"}
              onClick={() => cambiarColeccion(coleccion.clave)}
              type="button"
            >
              {coleccion.nombre}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <section aria-label="Resultados de búsqueda" className="flex flex-col gap-3">
          <AvisoCarga texto="Buscando en la memoria…" />
          {[0, 1, 2].map((indice) => (
            <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4" key={indice}>
              <Esqueleto className="h-4 w-2/5" />
              <Esqueleto className="h-4 w-full" />
            </div>
          ))}
        </section>
      ) : error ? (
        <EstadoError mensaje="No se pudo consultar la memoria. Inténtalo de nuevo." onReintentar={() => void ejecutarBusqueda()} />
      ) : resultados.length === 0 ? (
        <EstadoVacio mensaje="No encontramos fragmentos relacionados. Prueba con otras palabras o colecciones." />
      ) : (
        <section aria-label="Resultados de búsqueda" className="flex flex-col gap-3">
          {resultados.map((resultado) => {
            const porcentaje = Math.round(resultado.puntaje * 100);
            return (
              <article className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4" key={resultado.fuente}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1 font-mono text-xs text-text-2">{resultado.fuente}</span>
                  <span aria-label={`Similitud ${resultado.puntaje.toFixed(2)}`} className="num font-mono text-xs text-faint">
                    {resultado.puntaje.toFixed(2)}
                  </span>
                  <div aria-label={`Similitud ${porcentaje}%`} className="h-1.5 w-20 overflow-hidden rounded-pill bg-surface-active" role="img">
                    <div className="h-full rounded-pill bg-accent" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
                <p className="m-0 text-sm leading-relaxed text-text-2">{resultado.fragmento}</p>
              </article>
            );
          })}
        </section>
      )}
    </PageLayout>
  );
}

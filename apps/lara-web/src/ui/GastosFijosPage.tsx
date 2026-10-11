import { useEffect, useState } from "react";
import type { GastosFijosPort } from "../application/ports/GastosFijosPort";
import type { GastoFijoDetectado, ProyeccionMensual } from "../domain/GastoFijo";
import { Card } from "./components/Card";
import { EstadoError } from "./components/EstadoError";
import { EstadoVacio } from "./components/EstadoVacio";
import { AvisoCarga, EsqueletoTabla } from "./components/Esqueleto";
import { claseFoco } from "./components/foco";
import { PageLayout } from "./components/PageLayout";
import { formatoMoneda } from "./finanzasFormato";

interface GastosFijosPageProps {
  gastosFijos: GastosFijosPort;
}

/**
 * Muestra gastos fijos detectados y la proyección de los próximos seis meses.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Implementa carga, confirmación, descarte y proyección con puerto inyectado.
 */
export function GastosFijosPage({ gastosFijos }: GastosFijosPageProps) {
  const [gastos, setGastos] = useState<GastoFijoDetectado[]>([]);
  const [proyeccion, setProyeccion] = useState<ProyeccionMensual[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<ReadonlySet<string>>(() => new Set());

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [lista, meses] = await Promise.all([
        gastosFijos.listarDetectados(),
        gastosFijos.proyeccionSeisMeses(),
      ]);
      setGastos(lista);
      setProyeccion(meses);
    } catch (razon: unknown) {
      setError(razon instanceof Error ? razon.message : "No se pudieron cargar los gastos fijos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [gastosFijos]);

  async function actualizar(gasto: GastoFijoDetectado, accion: "confirmar" | "descartar") {
    setError(null);
    setOcupados((actuales) => new Set(actuales).add(gasto.id));
    try {
      if (accion === "confirmar") {
        const actualizado = await gastosFijos.confirmar(gasto.id);
        setGastos((actuales) => actuales.map((actual) => actual.id === actualizado.id ? actualizado : actual));
      } else {
        await gastosFijos.descartar(gasto.id);
        setGastos((actuales) => actuales.filter((actual) => actual.id !== gasto.id));
      }
      setProyeccion(await gastosFijos.proyeccionSeisMeses());
    } catch (razon: unknown) {
      setError(razon instanceof Error ? razon.message : "No se pudo actualizar el gasto fijo.");
    } finally {
      setOcupados((actuales) => {
        const siguientes = new Set(actuales);
        siguientes.delete(gasto.id);
        return siguientes;
      });
    }
  }

  const maximo = Math.max(...proyeccion.map((mes) => mes.total), 1);
  const explicacionPico = proyeccion.find((mes) => mes.esPico)?.explicacion;

  return (
    <PageLayout subtitulo="Pagos que se repiten y su proyección. Confirma los que detectó Lara." titulo="Gastos fijos">
      {cargando ? (
        <section aria-label="Cargando gastos fijos" className="flex flex-col gap-3">
          <AvisoCarga texto="Cargando gastos fijos y proyección…" />
          <EsqueletoTabla filas={6} />
        </section>
      ) : error && gastos.length === 0 ? (
        <EstadoError mensaje={error} onReintentar={() => void cargar()} />
      ) : (
        <>
          {error && <p className="m-0 text-sm text-danger" role="alert">{error}</p>}
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <Card aria-labelledby="titulo-detectados" className="overflow-hidden">
              <h2 className="m-0 text-base font-semibold" id="titulo-detectados">Detectados</h2>
              {gastos.length === 0 ? (
                <EstadoVacio mensaje="Aún no hay gastos fijos detectados. Cuando Lara encuentre pagos recurrentes, aparecerán aquí." />
              ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                  <table className="w-full border-collapse text-left text-sm" role="table">
                    <thead>
                      <tr className="border-b border-border text-label uppercase text-muted">
                        <th className="px-2 py-3 font-medium" scope="col">Concepto</th>
                        <th className="px-2 py-3 font-medium" scope="col">Día</th>
                        <th className="px-2 py-3 text-right font-medium" scope="col">Monto</th>
                        <th className="px-2 py-3 font-medium" scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map((gasto) => (
                        <tr className="border-b border-border last:border-0" key={gasto.id}>
                          <td className="px-2 py-3.5">
                            {gasto.concepto}
                            {gasto.origen && <span className="text-xs text-muted"> · {gasto.origen}</span>}
                          </td>
                          <td className="num px-2 py-3.5">{gasto.origen === "anual" ? "dic" : gasto.dia}</td>
                          <td className="num px-2 py-3.5 text-right">{formatoMoneda.MXN.format(gasto.monto)}</td>
                          <td className="px-2 py-3.5">
                            {gasto.confirmado ? (
                              <span className="text-sm text-muted">confirmado</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className={`min-h-11 rounded-pill border border-accent px-3 text-sm text-accent hover:bg-surface-hover disabled:opacity-50 ${claseFoco}`}
                                  disabled={ocupados.has(gasto.id)}
                                  onClick={() => void actualizar(gasto, "confirmar")}
                                  type="button"
                                >Confirmar</button>
                                <button
                                  className={`min-h-11 rounded-pill border border-border px-3 text-sm text-text-2 hover:bg-surface-hover disabled:opacity-50 ${claseFoco}`}
                                  disabled={ocupados.has(gasto.id)}
                                  onClick={() => void actualizar(gasto, "descartar")}
                                  type="button"
                                >Descartar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card aria-labelledby="titulo-proyeccion">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 text-base font-semibold" id="titulo-proyeccion">Proyección 6 meses</h2>
                <span className="font-mono text-xs text-muted">calculada en código</span>
              </div>
              {proyeccion.length === 0 ? (
                <EstadoVacio mensaje="La proyección estará disponible cuando haya gastos fijos para calcular." />
              ) : (
                <>
                  <figure aria-label="Proyección de gastos fijos para seis meses" className="m-0">
                    <div className="flex h-52 items-end gap-3 border-b border-border pt-5" role="img">
                      {proyeccion.map((mes) => (
                        <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" key={mes.mes}>
                          <span className={`num text-center text-xs ${mes.esPico ? "text-chart-4" : "text-muted"}`}>
                            {new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(mes.total)}
                          </span>
                          <div
                            aria-label={`${mes.mes}: ${formatoMoneda.MXN.format(mes.total)}${mes.esPico ? ", mes con mayor gasto" : ""}`}
                            className={`w-full rounded-t-md ${mes.esPico ? "bg-chart-4" : "bg-chart-2"}`}
                            role="img"
                            style={{ height: `${Math.max((mes.total / maximo) * 75, 4)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <figcaption className="flex gap-3 pt-2 font-mono text-xs text-muted">
                      {proyeccion.map((mes) => <span className="flex-1 text-center" key={mes.mes}>{mes.mes}</span>)}
                    </figcaption>
                  </figure>
                  {explicacionPico && <p className="m-0 text-sm leading-relaxed text-text-2">{explicacionPico}</p>}
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </PageLayout>
  );
}

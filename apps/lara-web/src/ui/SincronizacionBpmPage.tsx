import { useState } from "react";
import type { BpmSyncPort } from "../application/ports/BpmSyncPort";
import type { AccionBpm, ResultadoDryRunBpm } from "../domain/SincronizacionBpm";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { EstadoError } from "./components/EstadoError";
import { EstadoVacio } from "./components/EstadoVacio";
import { AvisoCarga, Esqueleto, EsqueletoTabla } from "./components/Esqueleto";
import { PageLayout } from "./components/PageLayout";
import { Pill } from "./components/Pill";

interface SincronizacionBpmPageProps {
  bpm: BpmSyncPort;
}

const resumen = [
  { clave: "crear", etiqueta: "Crear", tono: "text-accent" },
  { clave: "actualizar", etiqueta: "Actualizar", tono: "text-muted" },
  { clave: "sinCambios", etiqueta: "Sin cambios", tono: "text-text" },
  { clave: "huerfanas", etiqueta: "Huérfanas", tono: "text-text-2" },
] as const;

const etiquetaAccion: Record<AccionBpm, string> = {
  crear: "crear",
  actualizar: "actualizar",
  "sin-cambios": "sin cambios",
  huerfana: "huérfana",
};

/**
 * Pantalla de simulación BPM: presenta los cambios previstos sin escribir en Keycloak.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Sustituye el estado vacío por una simulación BPM bajo demanda.
 */
export function SincronizacionBpmPage({ bpm }: SincronizacionBpmPageProps) {
  const [resultado, setResultado] = useState<ResultadoDryRunBpm | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar() {
    setCargando(true);
    setError(null);
    try {
      setResultado(await bpm.ejecutarDryRun());
    } catch {
      setError("No se pudo preparar la simulación. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <PageLayout
      acciones={
        <div className="flex items-center gap-2">
          <Pill mono>Dry-run</Pill>
          <Button disabled={cargando} onClick={() => void ejecutar()} variant="primary">
            {cargando ? "Ejecutando…" : "Ejecutar dry-run"}
          </Button>
        </div>
      }
      subtitulo="Qué cambiaría en Keycloak al sincronizar con la base BPM simulada."
      titulo="Sincronización BPM"
    >
      {cargando ? (
        <section aria-label="Resultado de la simulación" className="flex flex-col gap-6">
          <AvisoCarga texto="Preparando la simulación BPM." />
          <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-2 wide:grid-cols-4">
            {resumen.map((item) => <Card className="min-h-32" key={item.clave}><Esqueleto className="h-4 w-2/3" /><Esqueleto className="h-8 w-1/3" /></Card>)}
          </div>
          <EsqueletoTabla filas={5} />
        </section>
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={() => void ejecutar()} />
      ) : resultado === null ? (
        <EstadoVacio mensaje="Ejecuta el dry-run para revisar los cambios que se simularían. No se modifica ninguna cuenta." />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Resumen de cambios simulados" className="grid grid-cols-1 gap-3 sm:grid-cols-2 wide:grid-cols-4">
            {resumen.map((item) => (
              <Card className="min-h-32 justify-center" key={item.clave}>
                <span className="text-compact text-muted">{item.etiqueta}</span>
                <span className={`num text-stat font-semibold ${item.tono}`}>{resultado[item.clave]}</span>
              </Card>
            ))}
          </section>
          {resultado.filas.length === 0 ? (
            <EstadoVacio mensaje="No se encontraron cambios para mostrar en esta simulación." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full min-w-150 border-collapse text-compact">
                <caption className="sr-only">Acciones previstas por usuario en la simulación BPM</caption>
                <thead>
                  <tr>
                    {["usuario", "acción", "detalle"].map((columna) => (
                      <th className="border-b border-border bg-surface px-3.5 py-3 text-left font-medium text-muted" key={columna} scope="col">{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.filas.map((fila) => (
                    <tr key={`${fila.usuario}-${fila.accion}`}>
                      <td className="border-b border-border px-3.5 py-3 font-mono text-text-2">{fila.usuario}</td>
                      <td className="border-b border-border px-3.5 py-3 text-text-2">{etiquetaAccion[fila.accion]}</td>
                      <td className="border-b border-border px-3.5 py-3 text-text-2">{fila.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="m-0 text-compact text-faint">Datos de ejemplo. Las cuentas huérfanas no se borran solas.</p>
        </div>
      )}
    </PageLayout>
  );
}

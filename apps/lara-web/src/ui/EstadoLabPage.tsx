import { useCallback, useEffect, useState } from "react";
import { ComprobarServicios } from "../application/use-cases/ComprobarServicios";
import {
  serviciosLab,
  serviciosPendientes,
  type Disponibilidad,
  type EstadoServicio,
} from "../domain/ServicioLab";
import { adaptadores } from "../infrastructure/composition";
import { Card } from "./components/Card";
import { AvisoCarga, Esqueleto } from "./components/Esqueleto";
import { EstadoVacio } from "./components/EstadoVacio";
import { claseFoco } from "./components/foco";
import { PageLayout } from "./components/PageLayout";
import { PuntoEstado, type EstadoPunto } from "./components/PuntoEstado";

const comprobarServicios = new ComprobarServicios(adaptadores.estadoLab);

const leyenda: Record<Disponibilidad, { texto: string; estado: EstadoPunto }> = {
  arriba: { texto: "Arriba", estado: "ok" },
  "sin-respuesta": { texto: "Sin respuesta", estado: "danger" },
};

/**
 * Pantalla "Estado del lab": comprobaciones reales de salud y pendientes marcados como vacíos.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Adaptador desde el composition root y servicios pendientes en domain/ServicioLab.
 * @modified Daniel Tovar 2026-10-10 Esqueleto de carga y vacíos sin jerga.
 */
export function EstadoLabPage() {
  const [estados, setEstados] = useState<EstadoServicio[] | null>(null);

  const comprobar = useCallback(async () => {
    setEstados(null);
    setEstados(await comprobarServicios.ejecutar());
  }, []);

  useEffect(() => {
    void comprobar();
  }, [comprobar]);

  return (
    <PageLayout
      acciones={
        <button
          className={`inline-flex min-h-11 items-center rounded-pill border border-border px-3 text-compact text-text-2 hover:bg-surface-hover shell:min-h-8 ${claseFoco}`}
          onClick={() => void comprobar()}
          type="button"
        >
          Actualizar
        </button>
      }
      subtitulo="Qué está arriba en tu PC y qué sigue en el checklist."
      titulo="Estado del lab"
    >
      <div className="grid grid-cols-1 gap-4 shell:grid-cols-4">
        {estados === null && (
          <>
            <AvisoCarga texto="Comprobando servicios…" />
            {serviciosLab.map((servicio) => (
              <Card aria-hidden="true" key={servicio.clave}>
                <Esqueleto className="h-5 w-2/5" />
                <Esqueleto className="h-3 w-4/5" />
                <Esqueleto className="h-4 w-1/4" />
              </Card>
            ))}
          </>
        )}
        {estados?.map(({ servicio, disponibilidad }) => (
          <Card key={servicio.clave}>
            <div className="flex items-center gap-2.5">
              <PuntoEstado estado={leyenda[disponibilidad].estado} />
              <span className="font-medium">{servicio.nombre}</span>
            </div>
            <span className="font-mono text-xs text-muted">{servicio.detalle}</span>
            <span className="text-compact text-text-2">{leyenda[disponibilidad].texto}</span>
          </Card>
        ))}
        {serviciosPendientes.map((servicio) => (
          <Card key={servicio.nombre}>
            <span className="font-medium">{servicio.nombre}</span>
            <span className="font-mono text-xs text-muted">{servicio.detalle}</span>
            <EstadoVacio mensaje="Aún no hay comprobación de salud para este servicio." />
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-compact text-muted">
        <span className="inline-flex items-center gap-2"><PuntoEstado estado="ok" />Arriba</span>
        <span className="inline-flex items-center gap-2"><PuntoEstado estado="danger" />Sin respuesta</span>
      </div>

      <div className="grid grid-cols-1 gap-4 shell:grid-cols-2">
        <Card>
          <h2 className="m-0 text-base font-semibold">Avance por parte</h2>
          <EstadoVacio mensaje="El avance del plan aún no se muestra aquí; está en docs/plans/estado-lab.md." />
        </Card>
        <Card>
          <h2 className="m-0 text-base font-semibold">Sigue en el checklist</h2>
          <EstadoVacio mensaje="Los siguientes pendientes aún no se muestran aquí; están en docs/plans/estado-lab.md." />
        </Card>
      </div>
    </PageLayout>
  );
}

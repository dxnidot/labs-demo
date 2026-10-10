import { useCallback, useEffect, useState } from "react";
import { ComprobarServicios } from "../application/use-cases/ComprobarServicios";
import type { Disponibilidad, EstadoServicio } from "../domain/ServicioLab";
import { HttpEstadoLabAdapter } from "../infrastructure/adapters/HttpEstadoLabAdapter";
import { Card } from "./components/Card";
import { EstadoVacio } from "./components/EstadoVacio";
import { claseFoco } from "./components/foco";
import { PageLayout } from "./components/PageLayout";

const comprobarServicios = new ComprobarServicios(new HttpEstadoLabAdapter());

const serviciosPendientes = [
  { nombre: "Java A2A", detalle: ":8002 · Java A2A", pendiente: "AG-02" },
  { nombre: "TypeScript A2A", detalle: ":8003 · TypeScript A2A", pendiente: "AG-03" },
  { nombre: "Open WebUI", detalle: ":3000 · RAG", pendiente: "EXT-01" },
] as const;

const leyenda: Record<Disponibilidad, { texto: string; punto: string }> = {
  arriba: { texto: "Arriba", punto: "bg-ok" },
  "sin-respuesta": { texto: "Sin respuesta", punto: "bg-danger" },
};

function Punto({ clase }: { clase: string }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${clase}`} />;
}

/**
 * Pantalla "Estado del lab": comprobaciones reales de salud y pendientes marcados como vacíos.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
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
          className={`inline-flex min-h-11 items-center rounded-pill border border-border px-3 text-[13px] text-text-2 hover:bg-surface-hover min-[980px]:min-h-8 ${claseFoco}`}
          onClick={() => void comprobar()}
          type="button"
        >
          Actualizar
        </button>
      }
      subtitulo="Qué está arriba en tu PC y qué sigue en el checklist."
      titulo="Estado del lab"
    >
      <div className="grid grid-cols-1 gap-4 min-[980px]:grid-cols-4">
        {estados === null && (
          <p className="m-0 text-sm text-muted min-[980px]:col-span-4" role="status">
            Comprobando servicios…
          </p>
        )}
        {estados?.map(({ servicio, disponibilidad }) => (
          <Card key={servicio.clave}>
            <div className="flex items-center gap-2.5">
              <Punto clase={leyenda[disponibilidad].punto} />
              <span className="font-medium">{servicio.nombre}</span>
            </div>
            <span className="font-mono text-xs text-muted">{servicio.detalle}</span>
            <span className="text-[13px] text-text-2">{leyenda[disponibilidad].texto}</span>
          </Card>
        ))}
        {serviciosPendientes.map((servicio) => (
          <Card key={servicio.nombre}>
            <span className="font-medium">{servicio.nombre}</span>
            <span className="font-mono text-xs text-muted">{servicio.detalle}</span>
            <EstadoVacio fuente={`health check de ${servicio.nombre}`} pendiente={servicio.pendiente} />
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-[13px] text-muted">
        <span className="inline-flex items-center gap-2"><Punto clase="bg-ok" />Arriba</span>
        <span className="inline-flex items-center gap-2"><Punto clase="bg-danger" />Sin respuesta</span>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[980px]:grid-cols-2">
        <Card>
          <h2 className="m-0 text-base font-semibold">Avance por parte</h2>
          <EstadoVacio fuente="docs/plans/estado-lab.md" pendiente="UI-07" />
        </Card>
        <Card>
          <h2 className="m-0 text-base font-semibold">Sigue en el checklist</h2>
          <EstadoVacio fuente="docs/plans/estado-lab.md" pendiente="UI-07" />
        </Card>
      </div>
    </PageLayout>
  );
}

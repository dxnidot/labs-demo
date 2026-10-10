import { agentesConfig } from "../agentesConfig";
import { Card } from "./components/Card";
import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

const agentesPendientes = [
  { nombre: "calculos-financieros", detalle: "Java · A2A · :8002", pendiente: "AG-02" },
  { nombre: "traductor", detalle: "TypeScript · A2A · :8003", pendiente: "AG-03" },
] as const;

/**
 * Pantalla "Agentes": orquestador y subagente de finanzas desde la configuración estática.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 */
export function AgentesPage() {
  return (
    <PageLayout
      subtitulo="Quién atiende, a quién delega y cómo colaboran."
      titulo="Agentes"
    >
      <div className="grid grid-cols-1 gap-4 min-[980px]:grid-cols-3">
        {agentesConfig.map((agente) => (
          <Card key={agente.nombre}>
            <h2 className="m-0 text-[17px] font-semibold">{agente.nombre}</h2>
            <p className="m-0 text-sm leading-[1.55] text-muted">{agente.descripcion}</p>
            <span className="font-mono text-xs text-text-2">{agente.detalle}</span>
            <span className="self-start rounded-pill bg-surface-active px-2.5 py-0.5 text-xs text-muted">
              {agente.colaboracion}
            </span>
          </Card>
        ))}
        {agentesPendientes.map((agente) => (
          <Card key={agente.nombre}>
            <h2 className="m-0 text-[17px] font-semibold">{agente.nombre}</h2>
            <span className="font-mono text-xs text-text-2">{agente.detalle}</span>
            <EstadoVacio fuente={`agent card de ${agente.nombre}`} pendiente={agente.pendiente} />
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}

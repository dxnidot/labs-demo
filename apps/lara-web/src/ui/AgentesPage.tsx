import { agentesConfig, agentesPendientes } from "../domain/catalogoLab";
import { Card } from "./components/Card";
import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";
import { Pill } from "./components/Pill";

/**
 * Pantalla "Agentes": orquestador y subagente de finanzas desde la configuración estática.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Datos pendientes en domain/catalogoLab (sin datos en el componente).
 * @modified Daniel Tovar 2026-10-10 Vacío sin jerga.
 */
export function AgentesPage() {
  return (
    <PageLayout
      subtitulo="Quién atiende, a quién delega y cómo colaboran."
      titulo="Agentes"
    >
      <div className="grid grid-cols-1 gap-4 shell:grid-cols-3">
        {agentesConfig.map((agente) => (
          <Card key={agente.nombre}>
            <h2 className="m-0 text-heading font-semibold">{agente.nombre}</h2>
            <p className="m-0 text-sm leading-body text-muted">{agente.descripcion}</p>
            <span className="font-mono text-xs text-text-2">{agente.detalle}</span>
            <Pill className="self-start">{agente.colaboracion}</Pill>
          </Card>
        ))}
        {agentesPendientes.map((agente) => (
          <Card key={agente.nombre}>
            <h2 className="m-0 text-heading font-semibold">{agente.nombre}</h2>
            <span className="font-mono text-xs text-text-2">{agente.detalle}</span>
            <EstadoVacio mensaje="Este agente aún no está disponible en el lab." />
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}

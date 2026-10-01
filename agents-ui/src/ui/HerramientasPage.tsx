import { herramientasConfig, type PermisoHerramienta } from "../agentesConfig";
import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

const colorPermiso: Record<PermisoHerramienta, string> = {
  permitida: "text-ok",
  "solo lectura": "text-muted",
  "escritura con confirmación": "text-warn",
};

/**
 * Pantalla "Herramientas MCP": function tools del orquestador y finanzas desde la configuración estática.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 */
export function HerramientasPage() {
  return (
    <PageLayout
      subtitulo="Lo que el orquestador y sus agentes pueden hacer."
      titulo="Herramientas MCP"
    >
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-120 border-collapse text-[13px]">
          <thead>
            <tr>
              {["herramienta", "origen", "permiso"].map((columna) => (
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
            {herramientasConfig.map((herramienta) => (
              <tr key={herramienta.nombre}>
                <td className="border-b border-border px-3.5 py-3 font-mono text-text-2">
                  {herramienta.nombre}
                </td>
                <td className="border-b border-border px-3.5 py-3 text-text-2">{herramienta.origen}</td>
                <td className="border-b border-border px-3.5 py-3">
                  <span
                    className={`rounded-pill bg-surface-active px-2.5 py-0.5 text-xs ${colorPermiso[herramienta.permiso]}`}
                  >
                    {herramienta.permiso}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EstadoVacio fuente="MCP filesystem" pendiente="AG-06" />
    </PageLayout>
  );
}

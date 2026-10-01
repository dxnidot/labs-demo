import { ObtenerClaimsToken } from "../application/use-cases/ObtenerClaimsToken";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { Card } from "./components/Card";
import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";

const obtenerClaims = new ObtenerClaimsToken(keycloakAuthAdapter);

/**
 * Pantalla "Usuarios y roles": inspector de los claims del token en memoria; tabla vacía.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 */
export function UsuariosRolesPage() {
  const claims = obtenerClaims.ejecutar();
  const usuario =
    typeof claims?.preferred_username === "string" ? claims.preferred_username : "usuario actual";

  return (
    <PageLayout
      subtitulo="Vista de consulta del realm lab. Los cambios se hacen en Keycloak."
      titulo="Usuarios y roles"
    >
      <div className="grid grid-cols-1 gap-4 min-[980px]:grid-cols-2">
        <EstadoVacio className="self-start" fuente="Keycloak Admin REST API" pendiente="UI-07" />
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Inspector de token</h2>
            <span className="font-mono text-xs text-muted">{`${usuario} · access token`}</span>
          </div>
          {claims ? (
            <pre className="m-0 overflow-auto whitespace-pre-wrap break-all rounded-[10px] bg-bg p-4 font-mono text-[13px] leading-[1.6] text-text-2">
              {JSON.stringify(claims, null, 2)}
            </pre>
          ) : (
            <p className="m-0 text-sm text-muted">No hay token en memoria.</p>
          )}
          <p className="m-0 text-[13px] text-faint">
            Solo se decodifica en pantalla. El token nunca se guarda.
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}

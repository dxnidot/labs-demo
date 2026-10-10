import { useEffect, useState } from "react";
import type { UsuariosRealmPort } from "../application/ports/UsuariosRealmPort";
import type { UsuarioRealm } from "../domain/UsuarioRealm";
import { ObtenerClaimsToken } from "../application/use-cases/ObtenerClaimsToken";
import { adaptadores } from "../infrastructure/composition";
import { Card } from "./components/Card";
import { EstadoError } from "./components/EstadoError";
import { EstadoVacio } from "./components/EstadoVacio";
import { AvisoCarga, EsqueletoTabla } from "./components/Esqueleto";
import { PageLayout } from "./components/PageLayout";

const obtenerClaims = new ObtenerClaimsToken(adaptadores.auth);

/**
 * Pantalla "Usuarios y roles": inspector de los claims del token en memoria; tabla vacía.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Adaptador de auth desde el composition root (VITE_USE_MOCKS).
 * @modified Daniel Tovar 2026-10-10 Vacío sin jerga.
 * @modified Daniel Tovar 2026-10-10 Muestra usuarios del realm con estados de carga, vacío y error.
 */
export function UsuariosRolesPage({ usuariosRealm }: { usuariosRealm: UsuariosRealmPort }) {
  const [usuarios, setUsuarios] = useState<UsuarioRealm[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(false);
    usuariosRealm.listarUsuarios().then(
      (resultado) => {
        if (vigente) {
          setUsuarios(resultado);
          setCargando(false);
        }
      },
      () => {
        if (vigente) {
          setError(true);
          setCargando(false);
        }
      },
    );
    return () => {
      vigente = false;
    };
  }, [usuariosRealm, intento]);

  const claims = obtenerClaims.ejecutar();
  const usuario =
    typeof claims?.preferred_username === "string" ? claims.preferred_username : "usuario actual";

  return (
    <PageLayout
      subtitulo="Vista de consulta del realm lab. Los cambios se hacen en Keycloak."
      titulo="Usuarios y roles"
    >
      <div className="grid grid-cols-1 gap-4 shell:grid-cols-2">
        <section aria-label="Usuarios del realm" className="min-w-0 self-start">
          {cargando ? (
            <>
              <AvisoCarga texto="Cargando usuarios del realm." />
              <EsqueletoTabla filas={4} />
            </>
          ) : error ? (
            <EstadoError
              mensaje="No se pudo cargar la lista de usuarios. Inténtalo de nuevo."
              onReintentar={() => setIntento((actual) => actual + 1)}
            />
          ) : usuarios.length === 0 ? (
            <EstadoVacio mensaje="Aún no hay usuarios para mostrar en este realm." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full min-w-120 border-collapse text-compact">
                <thead>
                  <tr>
                    {["usuario", "grupo", "roles chat-api"].map((columna) => (
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario.username}>
                      <td className="border-b border-border px-3.5 py-3 font-mono text-text-2">
                        {usuario.username}
                      </td>
                      <td className="border-b border-border px-3.5 py-3 text-text-2">
                        {usuario.grupo ?? "Sin grupo"}
                      </td>
                      <td className="border-b border-border px-3.5 py-3">
                        {usuario.roles.length > 0 ? (
                          <ul aria-label={`Roles de ${usuario.username}`} className="m-0 flex list-none flex-wrap gap-2 p-0">
                            {usuario.roles.map((rol) => (
                              <li
                                className="rounded-button bg-surface-active px-2 py-0.5 font-mono text-xs text-muted"
                                key={rol}
                              >
                                {rol}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted">Sin roles</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Inspector de token</h2>
            <span className="font-mono text-xs text-muted">{`${usuario} · access token`}</span>
          </div>
          {claims ? (
            <pre className="m-0 overflow-auto whitespace-pre-wrap break-all rounded-button bg-bg p-4 font-mono text-compact leading-body text-text-2">
              {JSON.stringify(claims, null, 2)}
            </pre>
          ) : (
            <p className="m-0 text-sm text-muted">No hay token en memoria.</p>
          )}
          <p className="m-0 text-compact text-faint">
            Solo se decodifica en pantalla. El token nunca se guarda.
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}

import { useEffect, useState } from "react";
import { ObtenerMenu } from "../application/use-cases/ObtenerMenu";
import type { MenuOpcion } from "../domain/MenuOpcion";
import type { Usuario } from "../domain/Usuario";
import { adaptadores } from "../infrastructure/composition";
import { Card } from "./components/Card";
import { EstadoVacio } from "./components/EstadoVacio";
import { PageLayout } from "./components/PageLayout";
import { Pill } from "./components/Pill";

const obtenerMenu = new ObtenerMenu(adaptadores.menu);

/**
 * Pantalla "Menú por rol": opciones reales de GET /api/menu para el usuario actual.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Sobre PageLayout (encabezado fijo, único scroll) y corte responsive a 980px.
 * @modified Daniel Tovar 2026-10-10 Renombra identificadores de Keycloak según ADR-0006.
 * @modified Daniel Tovar 2026-10-10 Adaptador desde el composition root (VITE_USE_MOCKS).
 */
export function MenuPorRolPage({ usuario }: { usuario: Usuario }) {
  const [opciones, setOpciones] = useState<MenuOpcion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerMenu
      .ejecutar()
      .then((resultado) => {
        if (activo) {
          setOpciones(resultado);
        }
      })
      .catch((reason: unknown) => {
        if (activo) {
          setError(reason instanceof Error ? reason.message : "No se pudo cargar el menú.");
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <PageLayout
      acciones={
        <Pill contorno mono>
          kc-demo · GET /api/menu
        </Pill>
      }
      subtitulo="Lo que ve cada usuario según los roles de su token."
      titulo="Menú por rol"
    >
      <div className="grid grid-cols-1 gap-4 shell:grid-cols-2">
        <Card aria-label={`Menú de ${usuario.username}`}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex size-9 items-center justify-center rounded-full bg-surface-active font-semibold text-accent"
            >
              {usuario.username.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">{usuario.username}</span>
              <span className="text-compact text-muted">usuario actual</span>
            </div>
          </div>
          <div className="font-mono text-xs text-muted">
            {`roles: ${usuario.kcMenuRoles.length > 0 ? usuario.kcMenuRoles.join(", ") : "sin roles de kc-menu"}`}
          </div>
          {error && <p className="m-0 text-sm text-danger" role="alert">{error}</p>}
          {!error && opciones === null && (
            <p className="m-0 text-sm text-muted" role="status">Cargando menú…</p>
          )}
          {opciones?.length === 0 && (
            <p className="m-0 text-sm text-muted">El backend no devolvió opciones para este usuario.</p>
          )}
          {opciones && opciones.length > 0 && (
            <ul className="m-0 flex list-none flex-col overflow-hidden rounded-button border border-border p-0">
              {opciones.map((opcion) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0"
                  key={opcion.clave}
                >
                  <span>{opcion.titulo}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {opcion.acciones.map((accion) => (
                      <span
                        className="rounded-md bg-surface-active px-2 py-0.5 font-mono text-xs text-muted"
                        key={accion}
                      >
                        {accion}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <EstadoVacio
          className="self-start"
          fuente="kc-demo · GET /api/menu solo devuelve el usuario actual"
          pendiente="UI-07"
        />
      </div>
      <p className="m-0 text-compact text-faint">La acción también se valida en el backend.</p>
    </PageLayout>
  );
}

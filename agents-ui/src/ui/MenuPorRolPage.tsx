import { useEffect, useState } from "react";
import type { Aclaracion } from "../domain/Aclaracion";
import type { MenuOpcion } from "../domain/MenuOpcion";
import type { ResultadoAprobacion } from "../domain/ResultadoAprobacion";
import type { Usuario } from "../domain/Usuario";
import { Button } from "./components/Button";
import { Pill } from "./components/Pill";

interface MenuPorRolPageProps {
  aprobarAclaracion: (id: number) => Promise<ResultadoAprobacion>;
  obtenerAclaraciones: () => Promise<Aclaracion[]>;
  obtenerMenu: () => Promise<MenuOpcion[]>;
  usuario: Usuario;
}

/**
 * Presenta las opciones y acciones que el backend habilitó para el usuario.
 * @author Daniel
 * @since 2026-09-30
 */
export function MenuPorRolPage({
  aprobarAclaracion,
  obtenerAclaraciones,
  obtenerMenu,
  usuario,
}: MenuPorRolPageProps) {
  const [menu, setMenu] = useState<MenuOpcion[]>([]);
  const [aclaraciones, setAclaraciones] = useState<Aclaracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const opciones = await obtenerMenu();
        const puedeConsultar = opciones.some(
          (opcion) => opcion.clave === "aclaraciones" && opcion.acciones.includes("consultar"),
        );
        const registros = puedeConsultar ? await obtenerAclaraciones() : [];
        if (active) {
          setMenu(opciones);
          setAclaraciones(registros);
        }
      } catch (reason: unknown) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "No se pudo cargar el menú.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void cargar();
    return () => {
      active = false;
    };
  }, [obtenerAclaraciones, obtenerMenu]);

  async function aprobar(id: number) {
    setApprovingId(id);
    setError(null);
    try {
      const resultado = await aprobarAclaracion(id);
      setAclaraciones((actuales) =>
        actuales.map((aclaracion) =>
          aclaracion.id === resultado.id
            ? { ...aclaracion, estatus: resultado.estatus }
            : aclaracion,
        ),
      );
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo aprobar la aclaración.");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted">Cargando menú por rol…</p>;
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[640px]:px-8 min-[640px]:py-8">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="mb-7">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-accent">
            Acceso por rol
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Menú por rol</h1>
          <p className="mt-2 text-sm text-muted">
            Opciones para {usuario.username} según los permisos que validó el backend.
          </p>
          <div aria-label="Roles del usuario" className="mt-4 flex flex-wrap gap-2">
            {usuario.chatApiRoles.length > 0 ? (
              usuario.chatApiRoles.map((rol) => (
                <Pill key={rol} tone="lavender">{rol}</Pill>
              ))
            ) : (
              <Pill tone="butter">Sin roles de chat-api</Pill>
            )}
          </div>
        </header>

        {error && (
          <p
            className="mb-5 rounded-card border border-pink/30 bg-pill-pink px-4 py-3 text-sm text-pink"
            role="alert"
          >
            {error}
          </p>
        )}

        {menu.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
            No hay opciones disponibles para este usuario.
          </p>
        ) : (
          <div className="grid gap-4">
            {menu.map((opcion) => {
              const puedeAprobar =
                opcion.acciones.includes("aprobar") &&
                usuario.chatApiRoles.includes("autorizar");
              const muestraAclaraciones =
                opcion.clave === "aclaraciones" && opcion.acciones.includes("consultar");

              return (
                <article
                  className="rounded-card border border-border bg-surface p-5"
                  key={opcion.clave}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{opcion.titulo}</h2>
                      <p className="mt-1 font-mono text-xs text-muted">{opcion.ruta}</p>
                    </div>
                    <div aria-label={`Acciones de ${opcion.titulo}`} className="flex flex-wrap gap-2">
                      {opcion.acciones.map((accion) => (
                        <Pill key={accion} tone={accion === "aprobar" ? "mint" : "accent"}>
                          {accion}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  {muestraAclaraciones && aclaraciones.length === 0 && (
                    <p className="mt-5 border-t border-divider pt-4 text-sm text-muted">
                      No hay aclaraciones pendientes.
                    </p>
                  )}

                  {muestraAclaraciones && aclaraciones.length > 0 && (
                    <ul className="mt-5 divide-y divide-divider border-t border-divider">
                      {aclaraciones.map((aclaracion) => (
                        <li
                          className="flex flex-wrap items-center justify-between gap-3 py-4"
                          key={aclaracion.id}
                        >
                          <div>
                            <p className="text-sm font-medium">{aclaracion.descripcion}</p>
                            <p className="mt-1 font-mono text-xs text-muted">
                              #{aclaracion.id} · {aclaracion.estatus}
                            </p>
                          </div>
                          {puedeAprobar && aclaracion.estatus !== "aprobada" && (
                            <Button
                              disabled={approvingId !== null}
                              onClick={() => void aprobar(aclaracion.id)}
                              variant="primary"
                            >
                              {approvingId === aclaracion.id ? "Aprobando…" : "Aprobar"}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

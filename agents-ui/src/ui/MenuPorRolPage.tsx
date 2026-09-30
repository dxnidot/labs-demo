import { useEffect, useState } from "react";
import type { MenuOpcion } from "../domain/MenuOpcion";
import { Pill } from "./components/Pill";

interface MenuPorRolPageProps {
  obtenerMenu: () => Promise<MenuOpcion[]>;
}

/**
 * Presenta las opciones y acciones que el backend habilitó para el usuario.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 muestra solo menú y acciones de lectura.
 */
export function MenuPorRolPage({ obtenerMenu }: MenuPorRolPageProps) {
  const [menu, setMenu] = useState<MenuOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const opciones = await obtenerMenu();
        if (active) {
          setMenu(opciones);
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
  }, [obtenerMenu]);

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
            Opciones y acciones según los permisos que validó el backend.
          </p>
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
            {menu.map((opcion) => (
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
                      <Pill key={accion}>{accion}</Pill>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

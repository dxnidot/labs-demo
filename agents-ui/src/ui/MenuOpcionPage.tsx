import type { MenuOpcion } from "../domain/MenuOpcion";
import { Pill } from "./components/Pill";

interface MenuOpcionPageProps {
  opcion: MenuOpcion;
}

/**
 * Muestra el placeholder de una ruta autorizada por el menú del usuario.
 * @author Daniel
 * @since 2026-09-30
 */
export function MenuOpcionPage({ opcion }: MenuOpcionPageProps) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[640px]:px-8 min-[640px]:py-8">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="mb-7">
          <h1 className="text-2xl font-semibold">{opcion.titulo}</h1>
          <p className="mt-2 font-mono text-sm text-muted">{opcion.ruta}</p>
        </header>
        <section aria-label={`Acciones de ${opcion.titulo}`}>
          <h2 className="mb-3 text-sm font-medium">Acciones</h2>
          <div className="flex flex-wrap gap-2">
            {opcion.acciones.map((accion) => (
              <Pill key={accion}>{accion}</Pill>
            ))}
          </div>
        </section>
        <p className="mt-8 text-sm text-muted">
          Vista de prueba del control de acceso
        </p>
      </div>
    </section>
  );
}

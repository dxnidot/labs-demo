import { ShieldAlert } from "lucide-react";

interface AccesoDenegadoProps {
  mensaje?: string;
}

/**
 * Pantalla de reemplazo cuando el usuario entra por URL a una sección sin el rol requerido.
 * @author Daniel Tovar
 * @since 2026-10-02
 */
export function AccesoDenegado({ mensaje = "No tienes permiso para ver esta sección." }: AccesoDenegadoProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <ShieldAlert aria-hidden="true" className="size-8 text-faint" />
      <p className="m-0 text-sm text-muted" role="alert">
        {mensaje}
      </p>
    </div>
  );
}

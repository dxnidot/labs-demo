interface EstadoVacioProps {
  /** Qué falta y, si ayuda, qué hacer: en lenguaje de la persona, sin claves de backlog. */
  mensaje: string;
  className?: string;
}

/**
 * Estado vacío común: explica en una frase por qué no hay nada que mostrar todavía.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Recibe un mensaje en lenguaje claro (antes mostraba fuente e historia del backlog).
 */
export function EstadoVacio({ mensaje, className = "" }: EstadoVacioProps) {
  return (
    <p
      className={`m-0 rounded-card border border-dashed border-border px-5 py-4 text-compact text-faint ${className}`}
    >
      {mensaje}
    </p>
  );
}

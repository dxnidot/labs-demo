interface EstadoVacioProps {
  fuente: string;
  pendiente: string;
  className?: string;
}

/**
 * Estado vacío común: indica de dónde saldrán los datos y qué historia los habilita.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function EstadoVacio({ fuente, pendiente, className = "" }: EstadoVacioProps) {
  return (
    <p
      className={`m-0 rounded-card border border-dashed border-border px-5 py-4 text-[13px] text-faint ${className}`}
    >
      {`Sin datos todavía · Fuente: ${fuente} · Pendiente: ${pendiente}`}
    </p>
  );
}

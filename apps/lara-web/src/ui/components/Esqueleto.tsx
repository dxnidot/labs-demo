/**
 * Bloque gris que reserva el espacio de lo que se está cargando. Pulsa con CSS y la regla
 * prefers-reduced-motion de index.css lo deja quieto. Es decorativo: el aviso lo da AvisoCarga.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function Esqueleto({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-button bg-surface-active ${className}`} />;
}

/**
 * Aviso de carga para lectores de pantalla (role="status"), oculto a la vista: lo visible son los esqueletos.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function AvisoCarga({ texto }: { texto: string }) {
  return (
    <p className="sr-only" role="status">
      {texto}
    </p>
  );
}

/** Filas de texto de ejemplo con anchos distintos, para tarjetas y listas. */
export function EsqueletoLineas({ cantidad = 3 }: { cantidad?: number }) {
  const anchos = ["w-full", "w-4/5", "w-3/5"];
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: cantidad }, (_, indice) => (
        <Esqueleto className={`h-4 ${anchos[indice % anchos.length]}`} key={indice} />
      ))}
    </div>
  );
}

/** Esqueleto de tabla: encabezado y filas, con el mismo borde de las tablas de Lara. */
export function EsqueletoTabla({ filas = 4 }: { filas?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-card border border-border p-4">
      <Esqueleto className="h-4 w-2/5" />
      {Array.from({ length: filas }, (_, indice) => (
        <Esqueleto className="h-5 w-full" key={indice} />
      ))}
    </div>
  );
}

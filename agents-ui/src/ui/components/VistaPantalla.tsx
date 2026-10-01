import type { ReactNode } from "react";

interface VistaPantallaProps {
  titulo: string;
  subtitulo: string;
  acciones?: ReactNode;
  children: ReactNode;
}

/**
 * Estructura común de una pantalla: título, subtítulo y contenido con el padding de las maquetas.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function VistaPantalla({ titulo, subtitulo, acciones, children }: VistaPantallaProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-auto p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[26px] font-semibold">{titulo}</h1>
          <p className="m-0 text-sm text-muted">{subtitulo}</p>
        </div>
        {acciones}
      </header>
      {children}
    </div>
  );
}

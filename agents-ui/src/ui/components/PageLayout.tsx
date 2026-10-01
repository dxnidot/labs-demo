import type { HTMLAttributes, ReactNode, Ref } from "react";

type ContenidoProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;

interface PageLayoutProps {
  /** Título del encabezado estándar (h1). Se ignora si se pasa `cabecera`. */
  titulo?: string;
  subtitulo?: string;
  acciones?: ReactNode;
  /** Encabezado propio que sustituye al estándar; siempre queda fijo (shrink-0). */
  cabecera?: ReactNode;
  /** Barra fija bajo el encabezado: pestañas, chips o filtros. */
  pestanas?: ReactNode;
  /** Pie fijo (composer); nunca se encoge. */
  pie?: ReactNode;
  /** Elemento flotante sobre el contenido que no se desplaza con él. */
  flotante?: ReactNode;
  /** Contenido sin relleno ni columna interna: quien lo usa decide su propio espaciado. */
  libre?: boolean;
  /** Si es false el contenido no genera scroll (p. ej. el shell, cuyas vistas hijas ya lo tienen). */
  desplazable?: boolean;
  className?: string;
  contenidoClassName?: string;
  contenidoProps?: ContenidoProps;
  contenidoRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * Estructura común de toda vista: encabezado y pie fijos y un único contenedor con scroll.
 * El contenido va en una columna interna de altura automática para que sus hijos (tablas con
 * overflow, pestañas) nunca se encojan por flex-shrink dentro del contenedor con scroll.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function PageLayout({
  titulo,
  subtitulo,
  acciones,
  cabecera,
  pestanas,
  pie,
  flotante,
  libre = false,
  desplazable = true,
  className = "",
  contenidoClassName = "",
  contenidoProps,
  contenidoRef,
  children,
}: PageLayoutProps) {
  const relleno = libre ? "" : "px-4 pb-4 pt-6 sm:px-8 sm:pb-8";
  const scroll = desplazable ? "overflow-y-auto" : "flex flex-col overflow-hidden";
  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${className}`}>
      {cabecera ? (
        <div className="shrink-0" data-slot="page-header">
          {cabecera}
        </div>
      ) : (
        titulo && (
          <header
            className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-4 sm:px-8 sm:pt-8"
            data-slot="page-header"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="m-0 text-[1.625rem] font-semibold">{titulo}</h1>
              {subtitulo && <p className="m-0 text-sm text-muted">{subtitulo}</p>}
            </div>
            {acciones}
          </header>
        )
      )}
      {pestanas && (
        <div className="flex shrink-0 flex-col gap-4 px-4 pt-5 sm:px-8" data-slot="page-tabs">
          {pestanas}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={`min-h-0 flex-1 ${scroll} ${relleno} ${contenidoClassName}`}
          data-slot="page-content"
          ref={contenidoRef}
          {...contenidoProps}
        >
          {libre || !desplazable ? children : <div className="flex flex-col gap-6">{children}</div>}
        </div>
        {flotante}
      </div>
      {pie && (
        <div className="shrink-0" data-slot="page-footer">
          {pie}
        </div>
      )}
    </div>
  );
}

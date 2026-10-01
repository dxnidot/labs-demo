import type { ReactNode, RefObject } from "react";

interface SidebarProps {
  abierto?: boolean;
  children: ReactNode;
  /** Bajo 980px la barra es un drawer modal; desde 980px es una columna fija. */
  drawer?: boolean;
  onCerrar?: () => void;
  panelRef?: RefObject<HTMLElement | null>;
}

export const idBarraLateral = "barra-lateral";

/**
 * Barra lateral de marca, navegación y usuario: columna fija desde 980px y drawer modal por debajo.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Padding y separación de la maqueta (16px 12px, gap 16px).
 * @modified Daniel Tovar 2026-09-30 Drawer modal (fondo, role dialog) bajo 980px; el aside queda fuera de main.
 */
export function Sidebar({ abierto = true, children, drawer = false, onCerrar, panelRef }: SidebarProps) {
  return (
    <>
      {drawer && abierto && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-bg/70"
          data-testid="fondo-navegacion"
          onClick={onCerrar}
        />
      )}
      <aside
        aria-label={drawer ? "Navegación" : "Barra lateral"}
        aria-modal={drawer ? true : undefined}
        className={`flex shrink-0 flex-col gap-4 border-r border-border bg-sidebar px-3 py-4 outline-none ${
          drawer ? "fixed inset-y-0 left-0 z-30 w-68 max-w-[85vw]" : "h-full w-68"
        }`}
        hidden={drawer && !abierto}
        id={idBarraLateral}
        onClick={(event) => {
          if (drawer && event.target instanceof Element && event.target.closest("a")) {
            onCerrar?.();
          }
        }}
        ref={panelRef}
        role={drawer ? "dialog" : undefined}
        tabIndex={drawer ? -1 : undefined}
      >
        {children}
      </aside>
    </>
  );
}

import type { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

/**
 * Contenedor lateral fijo para marca, historial y acciones de usuario.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Padding y separación de la maqueta (16px 12px, gap 16px).
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="hidden h-dvh w-[272px] shrink-0 flex-col gap-4 border-r border-border bg-sidebar px-3 py-4 min-[980px]:flex">
      {children}
    </aside>
  );
}

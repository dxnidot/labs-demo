import type { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

/**
 * Contenedor lateral fijo para marca, historial y acciones de usuario.
 * @author Daniel
 * @since 2026-09-30
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="hidden h-dvh w-[272px] shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 min-[980px]:flex">
      {children}
    </aside>
  );
}

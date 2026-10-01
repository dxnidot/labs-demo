import type { ReactNode } from "react";
import { Link } from "react-router";

interface SidebarItemProps {
  active?: boolean;
  children: ReactNode;
  icono?: ReactNode;
  onClick?: () => void;
  reciente?: boolean;
  to: string;
}

/**
 * Enlace lateral con estado de página accesible; la variante reciente es la fila compacta del historial.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Añade ícono y variante compacta para Recientes.
 */
export function SidebarItem({
  active = false,
  children,
  icono,
  onClick,
  reciente = false,
  to,
}: SidebarItemProps) {
  const base = reciente
    ? "min-h-9 py-2 text-[13px] text-muted"
    : "min-h-11 gap-3 text-sm text-text-2";
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center truncate rounded-[8px] px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${base} ${
        active ? "bg-surface-active text-text" : "hover:bg-surface-hover hover:text-text"
      }`}
      onClick={onClick}
      to={to}
    >
      {icono}
      <span className="truncate">{children}</span>
    </Link>
  );
}

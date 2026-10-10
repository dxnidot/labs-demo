import type { ReactNode } from "react";
import { Link } from "react-router";
import { claseFocoInterno } from "./foco";

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
 * @modified Daniel Tovar 2026-09-30 Foco hacia adentro (no se recorta) y 44px táctiles en angosto.
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
    ? "min-h-11 py-2 text-[13px] text-muted min-[980px]:min-h-9"
    : "min-h-11 gap-3 text-sm text-text-2";
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center truncate rounded-[8px] px-3 text-left transition-colors ${claseFocoInterno} ${base} ${
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

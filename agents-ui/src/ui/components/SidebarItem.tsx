import type { ReactNode } from "react";
import { Link } from "react-router";

interface SidebarItemProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  to: string;
}

/**
 * Enlace lateral con estado de página accesible.
 * @author Daniel
 * @since 2026-09-30
 */
export function SidebarItem({ active = false, children, onClick, to }: SidebarItemProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 w-full items-center truncate rounded-button px-3 text-left text-sm transition-colors ${
        active
          ? "bg-surface-active text-text"
          : "text-text-2 hover:bg-surface-hover hover:text-text"
      }`}
      onClick={onClick}
      to={to}
    >
      <span className="truncate">{children}</span>
    </Link>
  );
}

import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  suave?: boolean;
}

/**
 * Etiqueta compacta de origen o tipo de evento (relleno o contorno).
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function Tag({ children, suave = false }: TagProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs ${
        suave ? "border border-border text-muted" : "bg-surface-active text-highlight"
      }`}
    >
      {children}
    </span>
  );
}

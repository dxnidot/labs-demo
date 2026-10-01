import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  "aria-label": string;
  children: ReactNode;
  tamano?: "normal" | "compacto";
  tono?: "normal" | "atenuado";
}

const clasesTamano = { normal: "size-11", compacto: "size-10" } as const;
const clasesTono = { normal: "text-text-2", atenuado: "text-muted" } as const;

/**
 * Botón compacto para controles que se representan con un icono.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Tamaño y tono por prop (los valores por defecto no cambian).
 */
export function IconButton({
  className = "",
  children,
  tamano = "normal",
  tono = "normal",
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`inline-flex ${clasesTamano[tamano]} items-center justify-center rounded-button ${clasesTono[tono]} transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

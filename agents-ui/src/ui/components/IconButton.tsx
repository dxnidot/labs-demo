import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  "aria-label": string;
  children: ReactNode;
}

/**
 * Botón compacto para controles que se representan con un icono.
 * @author Daniel
 * @since 2026-09-30
 */
export function IconButton({ className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      className={`inline-flex size-11 items-center justify-center rounded-button text-text-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

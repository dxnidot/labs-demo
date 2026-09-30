import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

/**
 * Botón accesible con variantes de acción principal y secundaria.
 * @author Daniel
 * @since 2026-09-30
 */
export function Button({
  variant = "ghost",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:bg-accent/85"
      : "border border-border text-text-2 hover:bg-surface-hover";

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

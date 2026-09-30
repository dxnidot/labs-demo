import type { ReactNode } from "react";

export type PillTone = "accent" | "mint" | "lavender" | "pink" | "butter" | "peach";

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<PillTone, string> = {
  accent: "bg-pill-accent text-accent",
  mint: "bg-pill-mint text-mint",
  lavender: "bg-pill-lavender text-lavender",
  pink: "bg-pill-pink text-pink",
  butter: "bg-pill-butter text-butter",
  peach: "bg-pill-peach text-peach",
};

/**
 * Etiqueta compacta con una paleta tonal definida por el sistema visual.
 * @author Daniel
 * @since 2026-09-30
 */
export function Pill({ tone = "accent", children, className = "" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 font-mono text-xs ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

import type { ReactNode } from "react";

/** Tonos que de verdad se distinguen en la paleta monocroma: neutro (acento) y los tres estados. */
export type PillTone = "accent" | "ok" | "warn" | "danger";

interface PillProps {
  tone?: PillTone;
  /** Contorno en lugar de relleno. */
  contorno?: boolean;
  /** Datos técnicos (puertos, ids, motores): IBM Plex Mono. */
  mono?: boolean;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<PillTone, string> = {
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
};

/**
 * Etiqueta compacta. El estado siempre va con texto: el tono solo lo refuerza.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Reduce los 6 tonos a los 4 distinguibles y añade contorno y mono.
 */
export function Pill({
  tone = "accent",
  contorno = false,
  mono = false,
  children,
  className = "",
}: PillProps) {
  const superficie = contorno ? "border border-border" : "bg-surface-active";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs ${superficie} ${mono ? "font-mono" : ""} ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

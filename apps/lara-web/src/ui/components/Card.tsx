import type { HTMLAttributes } from "react";

type Relleno = "normal" | "ninguno" | "amplio";
type Espacio = "normal" | "amplio";

interface CardProps extends HTMLAttributes<HTMLElement> {
  espacio?: Espacio;
  relleno?: Relleno;
}

const clasesRelleno: Record<Relleno, string> = {
  normal: "p-5",
  ninguno: "p-0",
  amplio: "p-8",
};

const clasesEspacio: Record<Espacio, string> = {
  normal: "gap-3",
  amplio: "gap-3.5",
};

/**
 * Tarjeta de contenido con el borde, radio y espaciado de las maquetas de Lara.
 * El relleno y el espacio interno se eligen por prop para no depender del orden del CSS generado.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function Card({
  className = "",
  espacio = "normal",
  relleno = "normal",
  ...props
}: CardProps) {
  return (
    <section
      className={`flex min-w-0 flex-col ${clasesEspacio[espacio]} rounded-card border border-border bg-surface ${clasesRelleno[relleno]} ${className}`}
      {...props}
    />
  );
}

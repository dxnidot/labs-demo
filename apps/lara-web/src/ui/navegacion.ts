import type { ReactNode } from "react";

/** Clase común de los iconos de navegación (lateral, riel y menú de usuario). */
export const iconoNav = "size-4.5 shrink-0";

/** Entrada de navegación del shell; `activo` fuerza el estado cuando la ruta tiene subrutas. */
export interface EntradaNav {
  activo?: boolean;
  etiqueta: string;
  icono: ReactNode;
  ruta: string;
}

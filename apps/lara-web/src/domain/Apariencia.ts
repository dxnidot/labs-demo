/** Fuentes de la interfaz que se pueden elegir en "Apariencia". */
export const fuentesUi = [
  { id: "ibm-plex-sans", nombre: "IBM Plex Sans" },
  { id: "ibm-plex-mono", nombre: "IBM Plex Mono" },
] as const;

export type FuenteUi = (typeof fuentesUi)[number]["id"];

export const fuentePorDefecto: FuenteUi = "ibm-plex-sans";

export function esFuenteUi(valor: unknown): valor is FuenteUi {
  return fuentesUi.some((fuente) => fuente.id === valor);
}

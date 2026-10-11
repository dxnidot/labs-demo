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

/** Preferencia de tema: "sistema" sigue prefers-color-scheme; claro y oscuro la fuerzan. */
export const temasUi = [
  { id: "sistema", nombre: "Sistema" },
  { id: "claro", nombre: "Claro" },
  { id: "oscuro", nombre: "Oscuro" },
] as const;

export type PreferenciaTema = (typeof temasUi)[number]["id"];

export const temaPorDefecto: PreferenciaTema = "sistema";

export function esPreferenciaTema(valor: unknown): valor is PreferenciaTema {
  return temasUi.some((tema) => tema.id === valor);
}

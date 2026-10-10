export type DestinoFocoBarra = "contraer" | "mostrar";

/**
 * Decide si el foco pendiente tras contraer o mostrar la barra lateral se puede aplicar ya.
 * Solo vale cuando la barra ya está en el estado al que apunta la acción: "mostrar" (botón de la barra
 * contraída) exige barra oculta y "contraer" exige barra visible. Así un efecto que corre con un estado
 * anterior, p. ej. el del montaje cuando se vacía tarde, no consume el destino antes de tiempo.
 */
export function focoAplicable(
  destino: DestinoFocoBarra | null,
  barraVisible: boolean,
): DestinoFocoBarra | null {
  if (destino === "mostrar" && !barraVisible) {
    return "mostrar";
  }
  if (destino === "contraer" && barraVisible) {
    return "contraer";
  }
  return null;
}

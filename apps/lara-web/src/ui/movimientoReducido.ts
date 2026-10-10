/** Comportamiento de scroll que respeta prefers-reduced-motion: sin animación si la persona la pidió reducida. */
export function comportamientoDeScroll(): ScrollBehavior {
  const reducido =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reducido ? "auto" : "smooth";
}

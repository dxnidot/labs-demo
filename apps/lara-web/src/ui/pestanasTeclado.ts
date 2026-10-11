import type { KeyboardEvent } from "react";

/**
 * Teclado del patrón de pestañas (WAI-ARIA): flechas izquierda/derecha, Inicio y Fin mueven el foco entre
 * las pestañas y la activan. Se usa en el onKeyDown del contenedor role="tablist"; cada pestaña lleva
 * tabIndex 0 si está activa y -1 si no (tabindex itinerante).
 */
export function alPulsarTeclaEnPestanas(event: KeyboardEvent<HTMLElement>): void {
  const pestanas = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
  const actual = pestanas.findIndex((pestana) => pestana === document.activeElement);
  if (actual < 0) {
    return;
  }

  const destinos: Record<string, number> = {
    ArrowRight: (actual + 1) % pestanas.length,
    ArrowLeft: (actual - 1 + pestanas.length) % pestanas.length,
    Home: 0,
    End: pestanas.length - 1,
  };
  const destino = destinos[event.key];
  if (destino === undefined) {
    return;
  }

  event.preventDefault();
  pestanas[destino].focus();
  pestanas[destino].click();
}

import type { FuenteUi } from "../../domain/Apariencia";

/** Aplica la fuente elegida con el atributo data-font de <html>, que redefine --font-sans en index.css. */
export function aplicarFuente(fuente: FuenteUi): void {
  document.documentElement.dataset.font = fuente;
}

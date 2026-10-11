import type { FuenteUi, PreferenciaTema } from "../../domain/Apariencia";

/** Aplica la fuente elegida con el atributo data-font de <html>, que redefine --font-sans en index.css. */
export function aplicarFuente(fuente: FuenteUi): void {
  document.documentElement.dataset.font = fuente;
}

/**
 * Aplica el tema: "sistema" quita data-theme (manda prefers-color-scheme); claro y oscuro lo fuerzan.
 * El color de la barra del navegador sale de las dos metas theme-color de index.html (iguales a --color-bg):
 * al forzar un tema solo queda activa la de ese tema.
 */
export function aplicarTema(tema: PreferenciaTema): void {
  const raiz = document.documentElement;
  if (tema === "sistema") {
    delete raiz.dataset.theme;
  } else {
    raiz.dataset.theme = tema;
  }
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][data-tema]')) {
    const original = meta.dataset.media ?? "";
    meta.setAttribute("media", tema === "sistema" || meta.dataset.tema === tema ? original : "not all");
  }
}

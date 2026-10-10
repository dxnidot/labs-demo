/** Indicador de foco visible compartido con IconButton; solo usa tokens de index.css. */
export const claseFoco =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Foco hacia adentro para controles dentro de contenedores con overflow, donde el outline externo se recortaría. */
export const claseFocoInterno =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

/** Foco del contenedor de un composer: se ve cuando el textarea interno tiene el foco. */
export const claseFocoContenedor =
  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent";

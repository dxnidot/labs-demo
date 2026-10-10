/** Colección de memoria vectorizada que se puede filtrar en la búsqueda. */
export interface ColeccionMemoria {
  clave: string;
  nombre: string;
}

/** Fragmento recuperado por la búsqueda semántica, con su puntaje de similitud (0 a 1). */
export interface ResultadoMemoria {
  fuente: string;
  fragmento: string;
  puntaje: number;
}

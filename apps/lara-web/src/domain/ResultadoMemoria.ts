/** Colección disponible para filtrar resultados de memoria. */
export interface ColeccionMemoria {
  clave: string;
  nombre: string;
}

/** Fragmento recuperado junto a su fuente y similitud, entre 0 y 1. */
export interface ResultadoMemoria {
  fuente: string;
  fragmento: string;
  puntaje: number;
}

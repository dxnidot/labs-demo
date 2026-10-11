import type { FuenteUi, PreferenciaTema } from "../../domain/Apariencia";

/**
 * Puerto de las preferencias visuales del usuario (no sensibles); nunca lanza: ante un fallo usa el valor por defecto.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface PreferenciasVisualesPort {
  leerFuente(): FuenteUi;
  guardarFuente(fuente: FuenteUi): void;
  leerTema(): PreferenciaTema;
  guardarTema(tema: PreferenciaTema): void;
}

import type { PreferenciasVisualesPort } from "../../application/ports/PreferenciasVisualesPort";
import { esFuenteUi, fuentePorDefecto, type FuenteUi } from "../../domain/Apariencia";

export const claveFuente = "lara.fuente";

/**
 * Guarda las preferencias visuales en localStorage (única excepción permitida del repo), siempre con try/catch.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class PreferenciasLocalStorageAdapter implements PreferenciasVisualesPort {
  constructor(private readonly almacen: () => Storage = () => window.localStorage) {}

  leerFuente(): FuenteUi {
    try {
      const valor = this.almacen().getItem(claveFuente);
      return esFuenteUi(valor) ? valor : fuentePorDefecto;
    } catch {
      return fuentePorDefecto;
    }
  }

  guardarFuente(fuente: FuenteUi): void {
    try {
      this.almacen().setItem(claveFuente, fuente);
    } catch {
      // Sin almacenamiento disponible (modo privado, datos bloqueados): la fuente solo vale en esta sesión.
    }
  }
}

export const preferenciasVisuales: PreferenciasVisualesPort = new PreferenciasLocalStorageAdapter();

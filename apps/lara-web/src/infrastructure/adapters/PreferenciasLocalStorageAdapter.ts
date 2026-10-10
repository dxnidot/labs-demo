import type { PreferenciasVisualesPort } from "../../application/ports/PreferenciasVisualesPort";
import {
  esFuenteUi,
  esPreferenciaTema,
  fuentePorDefecto,
  temaPorDefecto,
  type FuenteUi,
  type PreferenciaTema,
} from "../../domain/Apariencia";

export const claveFuente = "lara.fuente";
export const claveTema = "lara.tema";

/**
 * Guarda las preferencias visuales en localStorage (únicas claves permitidas: lara.fuente y lara.tema), siempre con try/catch.
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
    this.guardar(claveFuente, fuente);
  }

  leerTema(): PreferenciaTema {
    try {
      const valor = this.almacen().getItem(claveTema);
      return esPreferenciaTema(valor) ? valor : temaPorDefecto;
    } catch {
      return temaPorDefecto;
    }
  }

  guardarTema(tema: PreferenciaTema): void {
    this.guardar(claveTema, tema);
  }

  private guardar(clave: string, valor: string): void {
    try {
      this.almacen().setItem(clave, valor);
    } catch {
      // Sin almacenamiento disponible (modo privado, datos bloqueados): la preferencia solo vale en esta sesión.
    }
  }
}

export const preferenciasVisuales: PreferenciasVisualesPort = new PreferenciasLocalStorageAdapter();

import type { MenuPort } from '../ports/menu.port';

export class ObtenerMenu {
  constructor(private readonly menu: MenuPort) {}

  execute() {
    return this.menu.obtenerMenu();
  }
}

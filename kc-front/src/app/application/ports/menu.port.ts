import type { MenuOpcion } from '../../domain/models/menu-opcion';

export abstract class MenuPort {
  abstract obtenerMenu(): Promise<MenuOpcion[]>;
}

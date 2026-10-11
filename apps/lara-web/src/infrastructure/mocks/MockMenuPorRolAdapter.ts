// MOCK: Menús de usuarios ficticios para mostrar el filtrado por rol.
import type { MenuPorRolPort } from "../../application/ports/MenuPorRolPort";
import type { UsuarioMenu } from "../../domain/UsuarioMenu";

const usuarios: UsuarioMenu[] = [
  {
    username: "lucia-demo",
    roles: ["consultar"],
    opciones: [
      { clave: "solicitudes", titulo: "Solicitudes", ruta: "/solicitudes", acciones: ["Ver"] },
      { clave: "reportes", titulo: "Reportes", ruta: "/reportes", acciones: ["Ver"] },
    ],
  },
  {
    username: "marco-demo",
    roles: ["consultar", "autorizar"],
    opciones: [
      { clave: "solicitudes", titulo: "Solicitudes", ruta: "/solicitudes", acciones: ["Ver", "Aprobar"] },
      { clave: "reportes", titulo: "Reportes", ruta: "/reportes", acciones: ["Ver"] },
    ],
  },
  {
    username: "ines-demo",
    roles: ["capturar"],
    opciones: [
      { clave: "solicitudes", titulo: "Solicitudes", ruta: "/solicitudes", acciones: ["Crear", "Editar"] },
    ],
  },
];

/** Proporciona menús de prueba ficticios para comparar los roles.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockMenuPorRolAdapter implements MenuPorRolPort {
  async listarPorUsuario(): Promise<UsuarioMenu[]> {
    return usuarios.map((usuario) => ({
      ...usuario,
      roles: [...usuario.roles],
      opciones: usuario.opciones.map((opcion) => ({ ...opcion, acciones: [...opcion.acciones] })),
    }));
  }
}

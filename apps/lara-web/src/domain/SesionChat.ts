/** Superficie donde nació una sesión; ausente u otro valor se trata como "chat". */
export type OrigenSesion = "chat" | "finanzas";

export interface SesionChat {
  id: string;
  titulo: string;
  actualizado: Date;
  origen: OrigenSesion;
}

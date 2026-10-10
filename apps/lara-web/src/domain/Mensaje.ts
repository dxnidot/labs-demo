export interface Mensaje {
  rol: "usuario" | "agente";
  texto: string;
  fecha: Date;
}

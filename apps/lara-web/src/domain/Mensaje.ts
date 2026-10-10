/** Paso de un flujo determinista que un agente delegado ejecuta tras una transferencia A2A. */
export interface PasoFlujo {
  clave: string;
  nombre: string;
  completado: boolean;
}

export interface Mensaje {
  /** "evento" es el separador A2A centrado en mono ("orquestador → finanzas · A2A · transfiere el control"). */
  rol: "usuario" | "agente" | "evento";
  texto: string;
  fecha: Date;
  /** Solo para rol "evento": lista de pasos del flujo determinista, con check cuando completado. */
  pasos?: PasoFlujo[];
}

import type { ConsultaTablaAdk, NombreTablaAdk } from "../../domain/TablaAdk";

/** Consultas de solo lectura a las tablas del orquestador distintas de `sessions` (ya cubierta por AgentePort). */
export interface BaseDatosPort {
  consultarTabla(tabla: NombreTablaAdk): Promise<ConsultaTablaAdk>;
}

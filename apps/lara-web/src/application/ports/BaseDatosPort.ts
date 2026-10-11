import type { ConsultaTablaAdk, NombreTablaAdk } from "../../domain/TablaAdk";

/** Permite consultar tablas de ADK en modo de solo lectura.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface BaseDatosPort {
  consultarTabla(tabla: NombreTablaAdk): Promise<ConsultaTablaAdk>;
}

import type { GastoFijoDetectado, ProyeccionMensual } from "../../domain/GastoFijo";

/** Consulta y actualiza gastos fijos detectados, y calcula su proyección semestral.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface GastosFijosPort {
  listarDetectados(): Promise<GastoFijoDetectado[]>;
  confirmar(id: string): Promise<GastoFijoDetectado>;
  descartar(id: string): Promise<void>;
  proyeccionSeisMeses(): Promise<ProyeccionMensual[]>;
}

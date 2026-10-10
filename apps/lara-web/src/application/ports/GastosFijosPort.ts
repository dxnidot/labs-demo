import type { GastoFijoDetectado, ProyeccionMensual } from "../../domain/GastoFijo";

/** Gastos fijos detectados y su proyección a 6 meses (FIN-03 cuando exista el servicio real). */
export interface GastosFijosPort {
  listarDetectados(): Promise<GastoFijoDetectado[]>;
  confirmar(id: string): Promise<GastoFijoDetectado>;
  descartar(id: string): Promise<void>;
  proyeccionSeisMeses(): Promise<ProyeccionMensual[]>;
}

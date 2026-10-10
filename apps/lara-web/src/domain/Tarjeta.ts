/**
 * Tarjeta presentada por la API local; contiene solo los últimos cuatro dígitos.
 */
export interface Tarjeta {
  id: string;
  alias: string;
  ultimos4: string;
  diaCorte: number;
  diaPago: number;
  permiteLiquidarMsiAnticipado: boolean;
  activa: boolean;
}

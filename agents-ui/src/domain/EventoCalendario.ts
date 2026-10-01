/**
 * Evento de corte o pago ya calculado por el servicio de finanzas.
 */
export interface EventoCalendario {
  fecha: string;
  tipo: "CORTE" | "PAGO";
  alias: string;
}

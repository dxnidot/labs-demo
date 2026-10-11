import type { Moneda, OrigenMovimiento } from "../domain/MovimientoFinanciero";

export const formatoMoneda: Record<Moneda, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
  USD: new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }),
};

const formatoDiaMes = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatoDiaSemana = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  timeZone: "UTC",
});

const etiquetasOrigen: Record<OrigenMovimiento, string> = {
  MANUAL: "manual",
  IMPORT: "archivo",
  NOTIFICACION: "notificación",
};

/** Etiqueta de origen tal como la muestra la interfaz. */
export function etiquetaOrigen(origen: OrigenMovimiento): string {
  return etiquetasOrigen[origen];
}

function aFechaUtc(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/** Fecha corta como "5 oct". */
export function fechaCorta(fecha: string): string {
  return formatoDiaMes.format(aFechaUtc(fecha)).replace(/\.$/, "");
}

/** Fecha con día de la semana como "domingo 5 oct". */
export function fechaConDiaSemana(fecha: string): string {
  const instante = aFechaUtc(fecha);
  return `${formatoDiaSemana.format(instante)} ${fechaCorta(fecha)}`;
}

/** Muestra únicamente los últimos cuatro dígitos enmascarados. */
export function enmascarar(ultimos4: string): string {
  return `••••${ultimos4}`;
}

/** Fecha local de hoy como AAAA-MM-DD. */
export function fechaLocalActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Periodo local actual como AAAA-MM. */
export function periodoActual(): string {
  return fechaLocalActual().slice(0, 7);
}

const formatoMes = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" });
const formatoMesLargo = new Intl.DateTimeFormat("es-MX", { month: "long", day: "numeric", timeZone: "UTC" });

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Periodo AAAA-MM como "Septiembre 2026". */
export function etiquetaPeriodo(periodo: string): string {
  const [anio] = periodo.split("-");
  return `${capitalizar(formatoMes.format(aFechaUtc(`${periodo}-01`)))} ${anio}`;
}

/** Desplaza un periodo AAAA-MM por meses (negativo = hacia atrás). */
export function moverPeriodo(periodo: string, meses: number): string {
  const [anio, mes] = periodo.split("-").map(Number);
  const instante = new Date(Date.UTC(anio, mes - 1 + meses, 1));
  return `${instante.getUTCFullYear()}-${String(instante.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Días naturales entre dos fechas AAAA-MM-DD (positivo si `fecha` es posterior a `desde`). */
export function diasEntre(desde: string, fecha: string): number {
  return Math.round((aFechaUtc(fecha).getTime() - aFechaUtc(desde).getTime()) / 86_400_000);
}

/** "hoy", "mañana" o "en N días" según los días que faltan. */
export function textoEnDias(dias: number): string {
  if (dias === 0) {
    return "hoy";
  }
  return dias === 1 ? "mañana" : `en ${dias} días`;
}

/** Número de días de un periodo AAAA-MM. */
export function diasDelPeriodo(periodo: string): number {
  const [anio, mes] = periodo.split("-").map(Number);
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Fecha larga como "5 de octubre" (para etiquetas accesibles). */
export function fechaLarga(fecha: string): string {
  return formatoMesLargo.format(aFechaUtc(fecha));
}

/** "Actualizado hace N min" (o "hace N h"); null significa que aún no hay datos. */
export function textoActualizado(minutos: number | null): string {
  if (minutos === null) {
    return "Actualizando…";
  }
  if (minutos < 1) {
    return "Actualizado hace menos de 1 min";
  }
  return minutos < 60 ? `Actualizado hace ${minutos} min` : `Actualizado hace ${Math.floor(minutos / 60)} h`;
}


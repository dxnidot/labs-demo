// MOCK: gastos fijos ficticios para probar la detección y su proyección semestral.
import type { GastosFijosPort } from "../../application/ports/GastosFijosPort";
import type { GastoFijoDetectado, ProyeccionMensual } from "../../domain/GastoFijo";

const gastosIniciales: GastoFijoDetectado[] = [
  { id: "fijo-renta", concepto: "Renta", dia: 1, monto: 7500, origen: "", confirmado: true },
  { id: "fijo-internet", concepto: "Internet", dia: 5, monto: 499, origen: "", confirmado: true },
  { id: "fijo-celular", concepto: "Plan de celular", dia: 12, monto: 399, origen: "", confirmado: true },
  { id: "fijo-streaming", concepto: "Streaming", dia: 18, monto: 219, origen: "Wallet", confirmado: false },
  { id: "fijo-gimnasio", concepto: "Gimnasio", dia: 20, monto: 650, origen: "Wallet", confirmado: false },
  { id: "fijo-seguro", concepto: "Seguro del auto", dia: 31, monto: 9800, origen: "anual", confirmado: true },
];

const meses = ["oct", "nov", "dic", "ene", "feb", "mar"];

/** Adaptador en memoria de GastosFijosPort con gastos y proyección de ejemplo.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockGastosFijosAdapter implements GastosFijosPort {
  private gastos = gastosIniciales.map((gasto) => ({ ...gasto }));

  listarDetectados(): Promise<GastoFijoDetectado[]> {
    return Promise.resolve(this.gastos.map((gasto) => ({ ...gasto })));
  }

  confirmar(id: string): Promise<GastoFijoDetectado> {
    const gasto = this.gastos.find((actual) => actual.id === id);
    if (!gasto) return Promise.reject(new Error("No se encontró ese gasto fijo."));
    gasto.confirmado = true;
    return Promise.resolve({ ...gasto });
  }

  descartar(id: string): Promise<void> {
    if (!this.gastos.some((gasto) => gasto.id === id)) {
      return Promise.reject(new Error("No se encontró ese gasto fijo."));
    }
    this.gastos = this.gastos.filter((gasto) => gasto.id !== id);
    return Promise.resolve();
  }

  proyeccionSeisMeses(): Promise<ProyeccionMensual[]> {
    const gastosMensuales = this.gastos.filter((gasto) => gasto.origen !== "anual");
    const totalMensual = gastosMensuales.reduce((suma, gasto) => suma + gasto.monto, 0);
    const anual = this.gastos.find((gasto) => gasto.origen === "anual");
    return Promise.resolve(meses.map((mes, indice) => {
      const esPico = indice === 2 && anual !== undefined;
      return {
        mes,
        total: totalMensual + (esPico ? anual.monto : 0),
        esPico,
        ...(esPico ? { explicacion: "Diciembre sube por el seguro anual del auto. El resto de los meses se mantiene en $9,267 si confirmas los dos fijos detectados en Wallet." } : {}),
      };
    }));
  }
}

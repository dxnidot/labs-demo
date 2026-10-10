/** Pestañas de Finanzas: la ruta es /finanzas/<id>. La usan la vista y el título del documento. */
export const pestanasFinanzas = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "gastos", etiqueta: "Gastos" },
  { id: "ingresos", etiqueta: "Ingresos" },
  { id: "tarjetas", etiqueta: "Tarjetas y pagos" },
  { id: "trading-mx", etiqueta: "Trading MX" },
  { id: "trading-usa", etiqueta: "Trading USA" },
] as const;

import { useSearchParams } from "react-router";
import { Card } from "./components/Card";
import { claseFocoInterno } from "./components/foco";
import { Tag } from "./components/Tag";

const cuentas = [
  { id: "mx", etiqueta: "MX · MXN" },
  { id: "usa", etiqueta: "USA · USD" },
] as const;

type CuentaId = (typeof cuentas)[number]["id"];

const contenido: Record<CuentaId, { etiqueta: string; titulo: string; descripcion: string; puntos: string[] }> = {
  mx: {
    etiqueta: "MXN · solo títulos completos",
    titulo: "Aún no hay portafolio de la cuenta MX",
    descripcion:
      "Adjunta en el asistente el PDF de tu estado de cuenta de inversiones. Finanzas lo lee con código y te muestra la vista previa antes de guardar.",
    puntos: [
      "Posiciones, costo promedio y peso actual vs objetivo",
      "Sugerencia de aportación: primero lo que está debajo del objetivo",
      "Alertas de caída entre −12% y −15% del costo promedio",
    ],
  },
  usa: {
    etiqueta: "USD · admite fracciones",
    titulo: "Aún no hay portafolio de la cuenta USA",
    descripcion:
      "Igual que en MX: adjunta el estado de cuenta en el asistente. Los montos en USD nunca se suman con los de MXN.",
    puntos: [
      "Bloques de crecimiento y defensa con su peso objetivo",
      "Reparto del efectivo disponible en fracciones",
      "Efectivo remanente después de cada aportación",
    ],
  },
};

/**
 * Pestaña Inversiones: selector de cuenta MX | USA (se refleja en ?mercado=) y estado vacío hasta que exista el
 * importador de estados de cuenta.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 Una sola pestaña con selector MX | USA (antes Trading MX y Trading USA).
 */
export function FinanzasInversionesTab() {
  const [parametros, setParametros] = useSearchParams();
  const cuenta: CuentaId = parametros.get("mercado") === "usa" ? "usa" : "mx";
  const texto = contenido[cuenta];

  return (
    <div className="flex flex-col gap-4">
      <div
        aria-label="Cuenta"
        className="inline-flex self-start rounded-pill border border-border p-0.75"
        role="group"
      >
        {cuentas.map((opcion) => (
          <button
            aria-pressed={cuenta === opcion.id}
            className={`min-h-11 rounded-pill px-3 font-mono text-xs shell:min-h-7.5 ${claseFocoInterno} ${
              cuenta === opcion.id ? "bg-accent text-accent-ink" : "text-muted"
            }`}
            key={opcion.id}
            onClick={() => setParametros(opcion.id === "mx" ? {} : { mercado: opcion.id }, { replace: true })}
            type="button"
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
      <Card className="items-start" espacio="amplio" relleno="amplio">
        <Tag>{texto.etiqueta}</Tag>
        <h2 className="m-0 text-xl font-semibold">{texto.titulo}</h2>
        <p className="m-0 max-w-140 text-sm leading-relaxed text-muted">{texto.descripcion}</p>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-2">
          {texto.puntos.map((punto) => (
            <li key={punto}>{punto}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

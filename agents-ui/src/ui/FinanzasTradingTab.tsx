import { Card } from "./components/Card";
import { Tag } from "./components/Tag";

interface FinanzasTradingTabProps {
  mercado: "mx" | "usa";
}

const contenido = {
  mx: {
    etiqueta: "MXN · solo títulos completos",
    titulo: "Aún no hay portafolio de Trading MX",
    descripcion:
      "Adjunta en el chat el PDF de tu estado de cuenta de inversiones. Finanzas lo lee con código y te muestra la vista previa antes de guardar (FIN-04).",
    puntos: [
      "Posiciones, costo promedio y peso actual vs objetivo",
      "Sugerencia de aportación: primero lo que está debajo del objetivo",
      "Alertas de caída entre −12% y −15% del costo promedio",
    ],
  },
  usa: {
    etiqueta: "USD · admite fracciones",
    titulo: "Aún no hay portafolio de Trading USA",
    descripcion:
      "Igual que en MX: adjunta el estado de cuenta en el chat. Los montos en USD nunca se suman con los de MXN.",
    puntos: [
      "Bloques de crecimiento y defensa con su peso objetivo",
      "Reparto del efectivo disponible en fracciones",
      "Efectivo remanente después de cada aportación",
    ],
  },
} as const;

/**
 * Estado vacío de Trading MX y Trading USA hasta que exista FIN-04.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function FinanzasTradingTab({ mercado }: FinanzasTradingTabProps) {
  const texto = contenido[mercado];
  return (
    <Card className="items-start" espacio="amplio" relleno="amplio">
      <Tag>{texto.etiqueta}</Tag>
      <h2 className="m-0 text-xl font-semibold">{texto.titulo}</h2>
      <p className="m-0 max-w-[560px] text-sm leading-relaxed text-muted">{texto.descripcion}</p>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-2">
        {texto.puntos.map((punto) => (
          <li key={punto}>{punto}</li>
        ))}
      </ul>
    </Card>
  );
}

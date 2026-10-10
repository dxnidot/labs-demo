import { Pill } from "./Pill";

/**
 * Indicador discreto de que Lara usa datos ficticios (VITE_USE_MOCKS=true); no se muestra con los servicios reales.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function IndicadorMock({ activo }: { activo: boolean }) {
  if (!activo) {
    return null;
  }
  return (
    <span aria-label="Modo mock: datos ficticios" role="status" title="Modo mock: datos ficticios, sin servicios reales">
      <Pill className="px-2 py-0.5" contorno mono tone="warn">
        MOCK
      </Pill>
    </span>
  );
}

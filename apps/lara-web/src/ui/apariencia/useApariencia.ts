import { useCallback, useState } from "react";
import type { FuenteUi } from "../../domain/Apariencia";
import { preferenciasVisuales } from "../../infrastructure/adapters/PreferenciasLocalStorageAdapter";
import { aplicarFuente } from "./aplicarApariencia";

/**
 * Estado y acciones de las preferencias de "Apariencia": las lee del puerto, las aplica al documento y las guarda.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function useApariencia() {
  const [fuente, setFuente] = useState<FuenteUi>(() => preferenciasVisuales.leerFuente());

  const cambiarFuente = useCallback((nueva: FuenteUi) => {
    preferenciasVisuales.guardarFuente(nueva);
    aplicarFuente(nueva);
    setFuente(nueva);
  }, []);

  return { fuente, cambiarFuente };
}

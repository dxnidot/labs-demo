import { useCallback, useState } from "react";
import type { FuenteUi, PreferenciaTema } from "../../domain/Apariencia";
import { preferenciasVisuales } from "../../infrastructure/adapters/PreferenciasLocalStorageAdapter";
import { aplicarFuente, aplicarTema } from "./aplicarApariencia";

/**
 * Estado y acciones de las preferencias de "Apariencia": las lee del puerto, las aplica al documento y las guarda.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function useApariencia() {
  const [fuente, setFuente] = useState<FuenteUi>(() => preferenciasVisuales.leerFuente());
  const [tema, setTema] = useState<PreferenciaTema>(() => preferenciasVisuales.leerTema());

  const cambiarFuente = useCallback((nueva: FuenteUi) => {
    preferenciasVisuales.guardarFuente(nueva);
    aplicarFuente(nueva);
    setFuente(nueva);
  }, []);

  const cambiarTema = useCallback((nuevo: PreferenciaTema) => {
    preferenciasVisuales.guardarTema(nuevo);
    aplicarTema(nuevo);
    setTema(nuevo);
  }, []);

  return { fuente, cambiarFuente, tema, cambiarTema };
}

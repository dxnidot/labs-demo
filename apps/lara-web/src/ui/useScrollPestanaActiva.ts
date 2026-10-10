import { useEffect, useRef } from "react";

/**
 * Devuelve el ref de una lista de pestañas con scroll horizontal y mantiene visible la activa.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function useScrollPestanaActiva(activa: string) {
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pestana = lista.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (pestana && typeof pestana.scrollIntoView === "function") {
      pestana.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activa]);

  return lista;
}

import { useEffect, useState } from "react";

const consulta = "(max-width: 979px)";

function leerEstrecha(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(consulta).matches;
}

/**
 * Indica si la ventana es más estrecha que 980px; seguro cuando no existe matchMedia.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function useVistaEstrecha(): boolean {
  const [estrecha, setEstrecha] = useState(leerEstrecha);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const lista = window.matchMedia(consulta);
    const alCambiar = () => setEstrecha(lista.matches);
    lista.addEventListener("change", alCambiar);
    return () => lista.removeEventListener("change", alCambiar);
  }, []);

  return estrecha;
}

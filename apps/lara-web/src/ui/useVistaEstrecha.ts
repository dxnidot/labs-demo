import { useEffect, useState } from "react";

// Mismo corte que --breakpoint-shell de index.css (61.25rem = 980px).
const consulta = "(width < 61.25rem)";

function leerEstrecha(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(consulta).matches;
}

/**
 * Indica si la ventana es más estrecha que 980px; seguro cuando no existe matchMedia.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-10-10 La consulta usa el mismo corte en rem que el token shell de index.css.
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

import { useEffect, type RefObject } from "react";

const enfocables =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="file"]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de un drawer modal: Escape lo cierra y Tab / Shift+Tab quedan atrapados dentro.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export function useTrampaFoco(
  activo: boolean,
  onCerrar: () => void,
  panelRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!activo) {
      return;
    }

    function alPulsar(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        onCerrar();
        return;
      }
      const raiz = panelRef.current;
      if (event.key !== "Tab" || !raiz) {
        return;
      }

      const controles = Array.from(raiz.querySelectorAll<HTMLElement>(enfocables));
      const primero = controles[0];
      const ultimo = controles.at(-1);
      if (!primero || !ultimo) {
        event.preventDefault();
        raiz.focus();
        return;
      }

      const enfocado = document.activeElement;
      const dentro = enfocado !== null && raiz.contains(enfocado) && enfocado !== raiz;
      if (event.shiftKey && (!dentro || enfocado === primero)) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (!dentro || enfocado === ultimo)) {
        event.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [activo, onCerrar, panelRef]);
}

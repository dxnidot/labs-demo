import { useEffect, useState } from "react";

const intervaloMs = 30_000;

/** Minutos enteros transcurridos desde `desde`, al día cada 30 segundos; null si aún no hay fecha. */
export function useMinutosDesde(desde: Date | null): number | null {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(temporizador);
  }, []);

  return desde === null ? null : Math.max(0, Math.floor((ahora - desde.getTime()) / 60_000));
}

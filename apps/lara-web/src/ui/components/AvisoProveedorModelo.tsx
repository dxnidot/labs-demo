import { Info } from "lucide-react";

/** Texto fijo del aviso de ADR-0007: lo escrito en un chat viaja al proveedor del modelo de lenguaje. */
export const textoAvisoProveedor =
  "Lo que escribas aquí se envía al proveedor del modelo para generar la respuesta. No incluyas datos reales que no quieras compartir con él.";

interface AvisoProveedorModeloProps {
  /** Id para enlazarlo con el campo de mensaje mediante aria-describedby. */
  id: string;
  className?: string;
}

/**
 * Línea fija junto al campo de un chat que avisa de que el mensaje se envía al proveedor del modelo (ADR-0007).
 * No se puede cerrar y no guarda nada en el navegador: aparece siempre, antes del primer mensaje.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export function AvisoProveedorModelo({ id, className = "" }: AvisoProveedorModeloProps) {
  return (
    <p className={`m-0 flex items-start gap-2 text-compact text-faint ${className}`} id={id}>
      <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {textoAvisoProveedor}
    </p>
  );
}

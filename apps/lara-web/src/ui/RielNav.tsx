import type { ReactNode, RefObject } from "react";
import { ArrowLeft, LayoutDashboard, PanelLeftOpen } from "lucide-react";
import { Link } from "react-router";
import { claseFocoInterno } from "./components/foco";
import { IconButton } from "./components/IconButton";
import { iconoNav, type EntradaNav } from "./navegacion";

interface RielItemProps {
  activo: boolean;
  etiqueta: string;
  icono: ReactNode;
  to: string;
}

function RielItem({ activo, etiqueta, icono, to }: RielItemProps) {
  return (
    <Link
      aria-current={activo ? "page" : undefined}
      aria-label={etiqueta}
      className={`flex size-11 shrink-0 items-center justify-center rounded-button transition-colors shell:size-9.5 ${claseFocoInterno} ${
        activo ? "bg-surface-active text-text" : "text-text-2 hover:bg-surface-hover hover:text-text"
      }`}
      title={etiqueta}
      to={to}
    >
      {icono}
    </Link>
  );
}

interface RielNavProps {
  botonMostrarRef: RefObject<HTMLButtonElement | null>;
  enLaboratorio: boolean;
  enRuta: (ruta: string) => boolean;
  itemsLaboratorio: EntradaNav[];
  itemsPersonal: EntradaNav[];
  onMostrar: () => void;
}

/**
 * Riel de iconos que queda al contraer la barra lateral.
 * @author Daniel Tovar
 * @since 2026-11-19
 */
export function RielNav({
  botonMostrarRef,
  enLaboratorio,
  enRuta,
  itemsLaboratorio,
  itemsPersonal,
  onMostrar,
}: RielNavProps) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border bg-sidebar px-1.5 py-3">
      <IconButton
        aria-expanded={false}
        aria-label="Mostrar barra lateral"
        onClick={onMostrar}
        ref={botonMostrarRef}
        tamano="compacto"
        tono="atenuado"
      >
        <PanelLeftOpen aria-hidden="true" className="size-4.5" />
      </IconButton>
      <div aria-hidden="true" className="my-1 h-px w-6 shrink-0 bg-divider" />
      {enLaboratorio ? (
        <nav aria-label="Laboratorio" className="flex flex-col items-center gap-1">
          <RielItem
            activo={false}
            etiqueta="Volver al chat"
            icono={<ArrowLeft aria-hidden="true" className={iconoNav} />}
            to="/chat"
          />
          {itemsLaboratorio.map((item) => (
            <RielItem
              activo={enRuta(item.ruta)}
              etiqueta={item.etiqueta}
              icono={item.icono}
              key={item.ruta}
              to={item.ruta}
            />
          ))}
        </nav>
      ) : (
        <nav aria-label="Principal" className="flex flex-col items-center gap-1">
          <RielItem
            activo={enRuta("/estado")}
            etiqueta="Estado del lab"
            icono={<LayoutDashboard aria-hidden="true" className={iconoNav} />}
            to="/estado"
          />
          {itemsPersonal.map((item) => (
            <RielItem
              activo={item.activo ?? enRuta(item.ruta)}
              etiqueta={item.etiqueta}
              icono={item.icono}
              key={item.ruta}
              to={item.ruta}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

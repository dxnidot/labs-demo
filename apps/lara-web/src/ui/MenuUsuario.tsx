import { useEffect, type RefObject } from "react";
import { LogOut, Network, SunMoon } from "lucide-react";
import type { Usuario } from "../domain/Usuario";
import { claseFocoInterno } from "./components/foco";
import { IconButton } from "./components/IconButton";
import { iconoNav } from "./navegacion";

const idMenuUsuario = "menu-usuario";
const claseOpcion = `flex min-h-11 w-full items-center gap-2.5 rounded-button px-3 text-left text-sm text-text-2 transition-colors hover:bg-surface-hover hover:text-text ${claseFocoInterno}`;

interface MenuUsuarioProps {
  abierto: boolean;
  botonUsuarioRef: RefObject<HTMLButtonElement | null>;
  onAbrirApariencia: () => void;
  onAlternar: () => void;
  onCerrar: () => void;
  onCerrarSesion: () => void;
  /** Sin entradas de Laboratorio para el rol, la opción no se ofrece. */
  onLaboratorio?: () => void;
  usuario: Usuario;
}

/**
 * Pie de la barra lateral: botón de usuario con sus opciones (disclosure, sin roles de menú) y cierre de sesión.
 * Escape cierra la lista y devuelve el foco al botón de usuario.
 * @author Daniel Tovar
 * @since 2026-11-19
 */
export function MenuUsuario({
  abierto,
  botonUsuarioRef,
  onAbrirApariencia,
  onAlternar,
  onCerrar,
  onCerrarSesion,
  onLaboratorio,
  usuario,
}: MenuUsuarioProps) {
  useEffect(() => {
    if (!abierto) {
      return;
    }
    function alPulsarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onCerrar();
        botonUsuarioRef.current?.focus();
      }
    }
    document.addEventListener("keydown", alPulsarTecla);
    return () => document.removeEventListener("keydown", alPulsarTecla);
  }, [abierto, botonUsuarioRef, onCerrar]);

  return (
    <footer className="relative flex shrink-0 items-center gap-1 border-t border-border px-2 pb-1 pt-3">
      <button
        aria-controls={abierto ? idMenuUsuario : undefined}
        aria-expanded={abierto}
        className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-button py-1 pl-1 pr-2 text-left transition-colors hover:bg-surface-hover ${claseFocoInterno}`}
        onClick={onAlternar}
        ref={botonUsuarioRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-surface-active text-sm font-semibold text-accent"
        >
          {usuario.username.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">{usuario.username}</span>
          <span className="truncate text-xs text-muted">
            {`${usuario.kcMenuRoles.length > 0 ? usuario.kcMenuRoles.join(", ") : "sin rol"} · LOCAL`}
          </span>
        </div>
      </button>
      <IconButton aria-label="Cerrar sesión" onClick={onCerrarSesion} tamano="compacto" tono="atenuado">
        <LogOut aria-hidden="true" className="size-4.5" />
      </IconButton>

      {abierto && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-30" onClick={onCerrar} />
          <div
            aria-label="Opciones de usuario"
            className="absolute bottom-full left-2 z-40 mb-2 w-52 rounded-card border border-border bg-surface p-1"
            id={idMenuUsuario}
            role="group"
          >
            <button className={claseOpcion} onClick={onAbrirApariencia} type="button">
              <SunMoon aria-hidden="true" className={iconoNav} />
              Configuración
            </button>
            {onLaboratorio && (
              <button className={claseOpcion} onClick={onLaboratorio} type="button">
                <Network aria-hidden="true" className={iconoNav} />
                Laboratorio
              </button>
            )}
          </div>
        </>
      )}
    </footer>
  );
}

import type { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, Plus } from "lucide-react";
import { AvisoCarga, Esqueleto } from "./components/Esqueleto";
import { claseFoco } from "./components/foco";
import { SidebarItem } from "./components/SidebarItem";
import { iconoNav, type EntradaNav } from "./navegacion";
import { useChatSessions } from "./useChatSessions";

function SeccionNav({ titulo, children }: { titulo: string; children: ReactNode }) {
  const idTitulo = `nav-${titulo.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div aria-labelledby={idTitulo} className="flex flex-col gap-0.5" role="group">
      <h2
        className="m-0 px-3 pb-1.5 font-mono text-label font-normal tracking-label text-faint"
        id={idTitulo}
      >
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Recientes({ pathname }: { pathname: string }) {
  const { activeSessionId, historyError, isLoadingHistory, refreshSessions, selectSession, sessions } =
    useChatSessions();

  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <div className="flex items-center justify-between px-3 pb-1.5">
        <h2 className="m-0 font-mono text-label font-normal tracking-label text-faint">RECIENTES</h2>
        {isLoadingHistory && <AvisoCarga texto="Cargando conversaciones…" />}
      </div>
      <nav aria-label="Historial de chats" className="flex flex-col gap-0.5">
        {sessions.map((session) => (
          <SidebarItem
            active={pathname === "/chat" && session.id === activeSessionId}
            key={session.id}
            onClick={() => selectSession(session.id)}
            reciente
            to="/chat"
          >
            {session.titulo}
          </SidebarItem>
        ))}
        {!isLoadingHistory && sessions.length === 0 && (
          <p className="m-0 px-3 py-2 text-xs text-faint">Aún no hay conversaciones.</p>
        )}
        {historyError && (
          <div className="flex flex-col items-start gap-1 px-3 py-2">
            <p className="m-0 text-xs text-danger" role="alert">
              {historyError}
            </p>
            <button
              className="inline-flex min-h-11 items-center text-xs text-accent underline hover:text-accent-hover shell:min-h-0"
              onClick={() => void refreshSessions().catch(() => undefined)}
              type="button"
            >
              Reintentar
            </button>
          </div>
        )}
        {isLoadingHistory && sessions.length === 0 && (
          <div aria-hidden="true" className="flex flex-col gap-2 px-3 py-2">
            <Esqueleto className="h-3.5 w-4/5" />
            <Esqueleto className="h-3.5 w-3/5" />
          </div>
        )}
      </nav>
    </div>
  );
}

interface NavLateralProps {
  enLaboratorio: boolean;
  enRuta: (ruta: string) => boolean;
  itemsLaboratorio: EntradaNav[];
  itemsPersonal: EntradaNav[];
  onNuevoChat: () => void;
  onVolverAlChat: () => void;
  pathname: string;
}

/**
 * Cuerpo de la barra lateral: acción principal (Nuevo chat / Volver al chat), navegación y Recientes.
 * @author Daniel Tovar
 * @since 2026-11-19
 */
export function NavLateral({
  enLaboratorio,
  enRuta,
  itemsLaboratorio,
  itemsPersonal,
  onNuevoChat,
  onVolverAlChat,
  pathname,
}: NavLateralProps) {
  return (
    <>
      {enLaboratorio ? (
        <button
          className={`flex min-h-11 w-full shrink-0 items-center gap-2.5 rounded-button px-3.5 text-sm font-semibold text-text-2 transition-colors hover:bg-surface-hover hover:text-text ${claseFoco}`}
          onClick={onVolverAlChat}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className={iconoNav} />
          Volver al chat
        </button>
      ) : (
        <button
          className={`flex min-h-11 w-full shrink-0 items-center gap-2.5 rounded-button bg-accent px-3.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover ${claseFoco}`}
          onClick={onNuevoChat}
          type="button"
        >
          <Plus aria-hidden="true" className={iconoNav} />
          Nuevo chat
        </button>
      )}

      {enLaboratorio ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
          <SeccionNav titulo="LABORATORIO">
            {itemsLaboratorio.map((item) => (
              <SidebarItem active={enRuta(item.ruta)} icono={item.icono} key={item.ruta} to={item.ruta}>
                {item.etiqueta}
              </SidebarItem>
            ))}
          </SeccionNav>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
          <nav aria-label="Principal" className="flex shrink-0 flex-col gap-3.5">
            <SidebarItem
              active={enRuta("/estado")}
              icono={<LayoutDashboard aria-hidden="true" className={iconoNav} />}
              to="/estado"
            >
              Estado del lab
            </SidebarItem>

            {itemsPersonal.length > 0 && (
              <SeccionNav titulo="PERSONAL · SOLO LOCAL">
                {itemsPersonal.map((item) => (
                  <SidebarItem
                    active={item.activo ?? enRuta(item.ruta)}
                    icono={item.icono}
                    key={item.ruta}
                    to={item.ruta}
                  >
                    {item.etiqueta}
                  </SidebarItem>
                ))}
              </SeccionNav>
            )}
          </nav>

          <Recientes pathname={pathname} />
        </div>
      )}
    </>
  );
}

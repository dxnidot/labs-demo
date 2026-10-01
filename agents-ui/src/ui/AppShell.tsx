import { useEffect, useState, type ReactNode } from "react";
import {
  Calendar,
  ChartNoAxesColumn,
  Database,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeft,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  TextAlignStart,
  Users,
  Waypoints,
  Wrench,
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { IconButton } from "./components/IconButton";
import { LaraLogo } from "./components/LaraLogo";
import { Sidebar } from "./components/Sidebar";
import { SidebarItem } from "./components/SidebarItem";
import { AgentesPage } from "./AgentesPage";
import { BaseDeDatosPage } from "./BaseDeDatosPage";
import { ChatPage } from "./ChatPage";
import { EstadoLabPage } from "./EstadoLabPage";
import { FinanzasPage } from "./FinanzasPage";
import { GastosFijosPage } from "./GastosFijosPage";
import { HerramientasPage } from "./HerramientasPage";
import { LoginPage } from "./LoginPage";
import { MemoriaPage } from "./MemoriaPage";
import { MenuPorRolPage } from "./MenuPorRolPage";
import { SincronizacionBpmPage } from "./SincronizacionBpmPage";
import { UsuariosRolesPage } from "./UsuariosRolesPage";
import { ChatSessionsProvider, useChatSessions } from "./useChatSessions";

const iniciarSesion = new IniciarSesion(keycloakAuthAdapter);
const iconoNav = "size-[18px] shrink-0";

/**
 * Autentica al usuario (login propio de Lara + Keycloak) y compone el shell con sus vistas.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Pantalla de login propia, sidebar de la maqueta y una ruta por vista.
 */
export function AppShell() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [comprobando, setComprobando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    iniciarSesion
      .ejecutar()
      .then((autenticado) => {
        if (active) {
          setUsuario(autenticado);
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudo conectar con Keycloak. Revisa que esté arriba en localhost:8080.");
        }
      })
      .finally(() => {
        if (active) {
          setComprobando(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function continuarConKeycloak() {
    setError(null);
    iniciarSesion.login().catch(() => {
      setError("No se pudo abrir el login de Keycloak. Revisa que esté arriba en localhost:8080.");
    });
  }

  if (!usuario) {
    return <LoginPage comprobando={comprobando} error={error} onLogin={continuarConKeycloak} />;
  }

  return (
    <ChatSessionsProvider userId={usuario.id}>
      <AppShellLayout usuario={usuario} />
    </ChatSessionsProvider>
  );
}

interface AppShellLayoutProps {
  usuario: Usuario;
}

function SeccionNav({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-0.5">
      <h2 className="m-0 px-3 pb-1.5 font-mono text-[11px] font-normal tracking-[0.08em] text-faint">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function AppShellLayout({ usuario }: AppShellLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    activeSessionId,
    historyError,
    isLoadingHistory,
    selectSession,
    sessions,
    setActiveSessionId,
  } = useChatSessions();
  const [error, setError] = useState<string | null>(null);
  const [barraVisible, setBarraVisible] = useState(true);

  function iniciarChatNuevo() {
    setError(null);
    setActiveSessionId(null);
    navigate("/chat");
  }

  async function cerrarSesion() {
    try {
      await keycloakAuthAdapter.logout();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo cerrar sesión.");
    }
  }

  const enRuta = (ruta: string) => pathname === ruta;
  const enFinanzas = pathname === "/finanzas" || pathname.startsWith("/finanzas/");

  return (
    <main className="flex h-dvh overflow-hidden bg-bg font-sans text-text">
      {barraVisible ? (
        <Sidebar>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <LaraLogo />
              <span className="text-[19px] font-semibold">Lara</span>
            </div>
            <IconButton
              aria-label="Contraer barra lateral"
              onClick={() => setBarraVisible(false)}
              tamano="compacto"
              tono="atenuado"
            >
              <PanelLeft aria-hidden="true" className="size-[18px]" />
            </IconButton>
          </div>

          <div className="flex flex-col gap-1">
            <button
              className="flex min-h-11 w-full items-center gap-2.5 rounded-[10px] bg-accent px-3.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={iniciarChatNuevo}
              type="button"
            >
              <Plus aria-hidden="true" className={iconoNav} />
              Nuevo chat
            </button>
            <div className="mt-1">
              <SidebarItem
                active={enRuta("/estado")}
                icono={<LayoutDashboard aria-hidden="true" className={iconoNav} />}
                to="/estado"
              >
                Estado del lab
              </SidebarItem>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto">
            <SeccionNav titulo="AGENTES">
              <SidebarItem
                active={enRuta("/agentes")}
                icono={<Network aria-hidden="true" className={iconoNav} />}
                to="/agentes"
              >
                Agentes
              </SidebarItem>
              <SidebarItem
                active={enRuta("/base-de-datos")}
                icono={<Database aria-hidden="true" className={iconoNav} />}
                to="/base-de-datos"
              >
                Base de datos
              </SidebarItem>
              <SidebarItem
                active={enRuta("/memoria")}
                icono={<Waypoints aria-hidden="true" className={iconoNav} />}
                to="/memoria"
              >
                Memoria vectorizada
              </SidebarItem>
              <SidebarItem
                active={enRuta("/herramientas")}
                icono={<Wrench aria-hidden="true" className={iconoNav} />}
                to="/herramientas"
              >
                Herramientas MCP
              </SidebarItem>
            </SeccionNav>

            <SeccionNav titulo="IDENTIDAD">
              <SidebarItem
                active={enRuta("/menu-por-rol")}
                icono={<TextAlignStart aria-hidden="true" className={iconoNav} />}
                to="/menu-por-rol"
              >
                Menú por rol
              </SidebarItem>
              <SidebarItem
                active={enRuta("/usuarios")}
                icono={<Users aria-hidden="true" className={iconoNav} />}
                to="/usuarios"
              >
                Usuarios y roles
              </SidebarItem>
              <SidebarItem
                active={enRuta("/sincronizacion-bpm")}
                icono={<RefreshCw aria-hidden="true" className={iconoNav} />}
                to="/sincronizacion-bpm"
              >
                Sincronización BPM
              </SidebarItem>
            </SeccionNav>

            <SeccionNav titulo="PERSONAL · SOLO LOCAL">
              <SidebarItem
                active={enFinanzas}
                icono={<ChartNoAxesColumn aria-hidden="true" className={iconoNav} />}
                to="/finanzas"
              >
                Finanzas
              </SidebarItem>
              <SidebarItem
                active={enRuta("/gastos-fijos")}
                icono={<Calendar aria-hidden="true" className={iconoNav} />}
                to="/gastos-fijos"
              >
                Gastos fijos
              </SidebarItem>
            </SeccionNav>

            <section aria-label="Recientes" className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-3 pb-1.5">
                <h2 className="m-0 font-mono text-[11px] font-normal tracking-[0.08em] text-faint">
                  RECIENTES
                </h2>
                {isLoadingHistory && <span className="text-xs text-muted">Cargando…</span>}
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
                  <p className="m-0 px-3 py-2 text-xs text-danger" role="alert">{historyError}</p>
                )}
              </nav>
            </section>
          </div>

          <footer className="flex items-center gap-2.5 border-t border-border px-2 pb-1 pt-3">
            <span
              aria-hidden="true"
              className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-surface-active text-sm font-semibold text-accent"
            >
              {usuario.username.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{usuario.username}</span>
              <span className="truncate text-xs text-muted">
                {`${usuario.chatApiRoles.length > 0 ? usuario.chatApiRoles.join(", ") : "sin rol"} · LOCAL`}
              </span>
            </div>
            <IconButton
              aria-label="Cerrar sesión"
              onClick={() => void cerrarSesion()}
              tamano="compacto"
              tono="atenuado"
            >
              <LogOut aria-hidden="true" className="size-[18px]" />
            </IconButton>
          </footer>
        </Sidebar>
      ) : (
        <div className="hidden w-14 shrink-0 flex-col items-center border-r border-border bg-sidebar pt-4 min-[980px]:flex">
          <IconButton
            aria-label="Mostrar barra lateral"
            onClick={() => setBarraVisible(true)}
            tamano="compacto"
            tono="atenuado"
          >
            <PanelLeftOpen aria-hidden="true" className="size-[18px]" />
          </IconButton>
        </div>
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {error && (
          <p className="m-0 border-b border-border bg-surface-active px-6 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Routes>
          <Route path="/" element={<Navigate replace to="/chat" />} />
          <Route path="/chat" element={<ChatPage usuario={usuario} />} />
          <Route path="/estado" element={<EstadoLabPage />} />
          <Route path="/agentes" element={<AgentesPage />} />
          <Route path="/base-de-datos" element={<BaseDeDatosPage usuario={usuario} />} />
          <Route path="/memoria" element={<MemoriaPage />} />
          <Route path="/herramientas" element={<HerramientasPage />} />
          <Route path="/menu-por-rol" element={<MenuPorRolPage usuario={usuario} />} />
          <Route path="/usuarios" element={<UsuariosRolesPage />} />
          <Route path="/sincronizacion-bpm" element={<SincronizacionBpmPage />} />
          <Route path="/gastos-fijos" element={<GastosFijosPage />} />
          <Route path="/finanzas" element={<Navigate replace to="/finanzas/resumen" />} />
          <Route path="/finanzas/pagos" element={<Navigate replace to="/finanzas/tarjetas" />} />
          <Route path="/finanzas/:tab" element={<FinanzasPage />} />
          <Route path="*" element={<Navigate replace to="/chat" />} />
        </Routes>
      </section>
    </main>
  );
}

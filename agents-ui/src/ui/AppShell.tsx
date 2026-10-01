import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Calendar,
  ChartNoAxesColumn,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  PanelLeft,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  TextAlignStart,
  Users,
  Waypoints,
  Wrench,
  X,
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { claseFoco } from "./components/foco";
import { IconButton } from "./components/IconButton";
import { LaraLogo } from "./components/LaraLogo";
import { PageLayout } from "./components/PageLayout";
import { idBarraLateral, Sidebar } from "./components/Sidebar";
import { SidebarItem } from "./components/SidebarItem";
import { ChatPage } from "./ChatPage";
import { FinanzasPage } from "./FinanzasPage";
import { LoginPage } from "./LoginPage";
import { ChatSessionsProvider, useChatSessions } from "./useChatSessions";
import { useTrampaFoco } from "./useTrampaFoco";
import { useVistaEstrecha } from "./useVistaEstrecha";

const AgentesPage = lazy(() => import("./AgentesPage").then((m) => ({ default: m.AgentesPage })));
const BaseDeDatosPage = lazy(() =>
  import("./BaseDeDatosPage").then((m) => ({ default: m.BaseDeDatosPage })),
);
const EstadoLabPage = lazy(() =>
  import("./EstadoLabPage").then((m) => ({ default: m.EstadoLabPage })),
);
const GastosFijosPage = lazy(() =>
  import("./GastosFijosPage").then((m) => ({ default: m.GastosFijosPage })),
);
const HerramientasPage = lazy(() =>
  import("./HerramientasPage").then((m) => ({ default: m.HerramientasPage })),
);
const MemoriaPage = lazy(() => import("./MemoriaPage").then((m) => ({ default: m.MemoriaPage })));
const MenuPorRolPage = lazy(() =>
  import("./MenuPorRolPage").then((m) => ({ default: m.MenuPorRolPage })),
);
const SincronizacionBpmPage = lazy(() =>
  import("./SincronizacionBpmPage").then((m) => ({ default: m.SincronizacionBpmPage })),
);
const UsuariosRolesPage = lazy(() =>
  import("./UsuariosRolesPage").then((m) => ({ default: m.UsuariosRolesPage })),
);

const iniciarSesion = new IniciarSesion(keycloakAuthAdapter);
const iconoNav = "size-4.5 shrink-0";

/**
 * Autentica al usuario (login propio de Lara + Keycloak) y compone el shell con sus vistas.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Pantalla de login propia, sidebar de la maqueta y una ruta por vista.
 * @modified Daniel Tovar 2026-09-30 Shell sobre PageLayout, drawer de navegación bajo 980px, landmarks y carga diferida.
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
  const idTitulo = `nav-${titulo.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div aria-labelledby={idTitulo} className="flex flex-col gap-0.5" role="group">
      <h2
        className="m-0 px-3 pb-1.5 font-mono text-[11px] font-normal tracking-[0.08em] text-faint"
        id={idTitulo}
      >
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function CargandoVista() {
  return (
    <p className="m-0 p-4 text-sm text-muted sm:p-8" role="status">
      Cargando vista…
    </p>
  );
}

function AppShellLayout({ usuario }: AppShellLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const estrecha = useVistaEstrecha();
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
  const [rutaDrawer, setRutaDrawer] = useState<string | null>(null);

  const panelNav = useRef<HTMLElement | null>(null);
  const botonMenu = useRef<HTMLButtonElement | null>(null);
  const botonContraer = useRef<HTMLButtonElement | null>(null);
  const botonMostrar = useRef<HTMLButtonElement | null>(null);
  const navEstabaAbierta = useRef(false);
  const focoPendiente = useRef<"contraer" | "mostrar" | null>(null);

  // El drawer queda abierto solo para la ruta en la que se abrió: al navegar se cierra sin efectos.
  const navAbierta = rutaDrawer === pathname;
  const drawerActivo = estrecha && navAbierta;
  const cerrarNav = useCallback(() => setRutaDrawer(null), []);
  useTrampaFoco(drawerActivo, cerrarNav, panelNav);

  useEffect(() => {
    if (!estrecha) {
      setRutaDrawer(null);
    }
  }, [estrecha]);

  useEffect(() => {
    if (drawerActivo) {
      panelNav.current?.focus();
    } else if (navEstabaAbierta.current) {
      botonMenu.current?.focus();
    }
    navEstabaAbierta.current = drawerActivo;
  }, [drawerActivo]);

  useEffect(() => {
    const destino = focoPendiente.current;
    focoPendiente.current = null;
    if (destino === "contraer") {
      botonContraer.current?.focus();
    } else if (destino === "mostrar") {
      botonMostrar.current?.focus();
    }
  }, [barraVisible]);

  function alternarBarra(visible: boolean) {
    focoPendiente.current = visible ? "contraer" : "mostrar";
    setBarraVisible(visible);
  }

  function iniciarChatNuevo() {
    setError(null);
    setActiveSessionId(null);
    setRutaDrawer(null);
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
  const barraCompleta = estrecha || barraVisible;

  const barraSuperior = estrecha && (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-sidebar px-2">
      <IconButton
        aria-controls={idBarraLateral}
        aria-expanded={drawerActivo}
        aria-label="Abrir navegación"
        onClick={() => setRutaDrawer(pathname)}
        ref={botonMenu}
        tono="atenuado"
      >
        <Menu aria-hidden="true" className="size-5" />
      </IconButton>
      <div className="flex items-center gap-2.5">
        <LaraLogo />
        <span className="text-[1.1875rem] font-semibold">Lara</span>
      </div>
    </header>
  );

  return (
    <PageLayout
      cabecera={barraSuperior || undefined}
      className="h-dvh bg-bg font-sans text-text"
      desplazable={false}
    >
      <div className="flex min-h-0 min-w-0 flex-1">
        {barraCompleta ? (
          <Sidebar abierto={drawerActivo} drawer={estrecha} onCerrar={cerrarNav} panelRef={panelNav}>
            <div className="flex shrink-0 items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <LaraLogo />
                <span className="text-[1.1875rem] font-semibold">Lara</span>
              </div>
              {estrecha ? (
                <IconButton
                  aria-label="Cerrar navegación"
                  onClick={cerrarNav}
                  tamano="compacto"
                  tono="atenuado"
                >
                  <X aria-hidden="true" className="size-4.5" />
                </IconButton>
              ) : (
                <IconButton
                  aria-controls={idBarraLateral}
                  aria-expanded={true}
                  aria-label="Contraer barra lateral"
                  onClick={() => alternarBarra(false)}
                  ref={botonContraer}
                  tamano="compacto"
                  tono="atenuado"
                >
                  <PanelLeft aria-hidden="true" className="size-4.5" />
                </IconButton>
              )}
            </div>

            <button
              className={`flex min-h-11 w-full shrink-0 items-center gap-2.5 rounded-[10px] bg-accent px-3.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover ${claseFoco}`}
              onClick={iniciarChatNuevo}
              type="button"
            >
              <Plus aria-hidden="true" className={iconoNav} />
              Nuevo chat
            </button>

            <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
              <nav aria-label="Principal" className="flex shrink-0 flex-col gap-3.5">
                <SidebarItem
                  active={enRuta("/estado")}
                  icono={<LayoutDashboard aria-hidden="true" className={iconoNav} />}
                  to="/estado"
                >
                  Estado del lab
                </SidebarItem>

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
              </nav>

              <div className="flex shrink-0 flex-col gap-0.5">
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
              </div>
            </div>

            <footer className="flex shrink-0 items-center gap-2.5 border-t border-border px-2 pb-1 pt-3">
              <span
                aria-hidden="true"
                className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-surface-active text-sm font-semibold text-accent"
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
                <LogOut aria-hidden="true" className="size-4.5" />
              </IconButton>
            </footer>
          </Sidebar>
        ) : (
          <div className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-sidebar pt-4">
            <IconButton
              aria-expanded={false}
              aria-label="Mostrar barra lateral"
              onClick={() => alternarBarra(true)}
              ref={botonMostrar}
              tamano="compacto"
              tono="atenuado"
            >
              <PanelLeftOpen aria-hidden="true" className="size-4.5" />
            </IconButton>
          </div>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {error && (
            <p className="m-0 shrink-0 border-b border-border bg-surface-active px-4 py-3 text-sm text-danger sm:px-6" role="alert">
              {error}
            </p>
          )}
          <Suspense fallback={<CargandoVista />}>
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
          </Suspense>
        </main>
      </div>
    </PageLayout>
  );
}

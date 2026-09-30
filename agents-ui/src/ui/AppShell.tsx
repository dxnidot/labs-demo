import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { AprobarAclaracion } from "../application/use-cases/AprobarAclaracion";
import { ObtenerAclaraciones } from "../application/use-cases/ObtenerAclaraciones";
import { ObtenerMenu } from "../application/use-cases/ObtenerMenu";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";
import { ApiHttpClient } from "../infrastructure/adapters/ApiHttpClient";
import { HttpAclaracionesAdapter } from "../infrastructure/adapters/HttpAclaracionesAdapter";
import { HttpMenuAdapter } from "../infrastructure/adapters/HttpMenuAdapter";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { Button } from "./components/Button";
import { IconButton } from "./components/IconButton";
import { Sidebar } from "./components/Sidebar";
import { SidebarItem } from "./components/SidebarItem";
import { ChatPage } from "./ChatPage";
import { MenuPorRolPage } from "./MenuPorRolPage";
import { ChatSessionsProvider, useChatSessions } from "./useChatSessions";

const iniciarSesion = new IniciarSesion(keycloakAuthAdapter);
const apiHttpClient = new ApiHttpClient(keycloakAuthAdapter);
const menuPort = new HttpMenuAdapter(apiHttpClient);
const aclaracionesPort = new HttpAclaracionesAdapter(apiHttpClient);
const obtenerMenu = new ObtenerMenu(menuPort);
const obtenerAclaraciones = new ObtenerAclaraciones(aclaracionesPort);
const aprobarAclaracion = new AprobarAclaracion(aclaracionesPort);
const cargarMenu = () => obtenerMenu.ejecutar();
const cargarAclaraciones = () => obtenerAclaraciones.ejecutar();
const aprobarAclaracionPorId = (id: number) => aprobarAclaracion.ejecutar(id);

/**
 * Autentica al usuario y compone el shell persistente con sus vistas.
 * @author Daniel
 * @since 2026-09-30
 */
export function AppShell() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState("Conectando con Keycloak…");

  useEffect(() => {
    let active = true;
    iniciarSesion
      .ejecutar()
      .then((autenticado) => {
        if (active) {
          setUsuario(autenticado);
          setEstado("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setEstado(
            reason instanceof Error ? reason.message : "No se pudo iniciar sesión.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (!usuario) {
    return (
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-bg px-6 text-text">
        <section className="w-full max-w-md rounded-card border border-border bg-surface p-8">
          <p className="font-mono text-sm text-accent">Lara · LOCAL</p>
          <h1 className="mt-3 text-2xl font-semibold">Iniciando sesión</h1>
          <p className="mt-3 text-sm text-muted" role="status">{estado}</p>
        </section>
      </main>
    );
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

function AppShellLayout({ usuario }: AppShellLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    activeSessionId,
    createSession,
    historyError,
    isCreatingSession,
    isLoadingHistory,
    selectSession,
    sessions,
  } = useChatSessions();
  const [error, setError] = useState<string | null>(null);

  async function iniciarChatNuevo() {
    setError(null);
    try {
      await createSession();
      navigate("/chat");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear una sesión.");
    }
  }

  async function cerrarSesion() {
    try {
      await keycloakAuthAdapter.logout();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo cerrar sesión.");
    }
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-bg font-sans text-text">
      <Sidebar>
        <div className="flex items-center gap-3 border-b border-divider pb-5">
          <span aria-hidden="true" className="text-3xl leading-none text-accent">◷</span>
          <span className="text-2xl font-semibold">Lara</span>
        </div>

        <div className="pt-5">
          <Button
            className="w-full justify-start"
            disabled={isCreatingSession}
            onClick={() => void iniciarChatNuevo()}
            variant="primary"
          >
            <span aria-hidden="true" className="text-xl leading-none">+</span>
            Nuevo chat
          </Button>
        </div>

        <nav aria-label="Vistas" className="mt-4 space-y-1">
          <SidebarItem active={pathname === "/chat"} to="/chat">Chat</SidebarItem>
          <SidebarItem active={pathname === "/menu"} to="/menu">Menú por rol</SidebarItem>
        </nav>

        <section aria-label="Recientes" className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between px-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">
              Recientes
            </h2>
            {isLoadingHistory && <span className="text-xs text-muted">Cargando…</span>}
          </div>
          <nav aria-label="Historial de chats" className="space-y-1">
            {sessions.map((session) => (
              <SidebarItem
                active={pathname === "/chat" && session.id === activeSessionId}
                key={session.id}
                onClick={() => selectSession(session.id)}
                to="/chat"
              >
                {session.titulo}
              </SidebarItem>
            ))}
            {!isLoadingHistory && sessions.length === 0 && (
              <p className="px-3 py-2 text-xs text-faint">Aún no hay conversaciones.</p>
            )}
            {historyError && (
              <p className="px-3 py-2 text-xs text-pink" role="alert">{historyError}</p>
            )}
          </nav>
        </section>

        <footer className="mt-4 flex items-center gap-3 border-t border-divider pt-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface-active font-semibold text-accent">
            {usuario.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{usuario.username}</p>
            <p className="truncate font-mono text-xs text-muted">
              {usuario.roles[0] ?? "LOCAL"} · LOCAL
            </p>
          </div>
          <IconButton aria-label="Cerrar sesión" onClick={() => void cerrarSesion()}>
            <span aria-hidden="true">↪</span>
          </IconButton>
        </footer>
      </Sidebar>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {error && (
          <p className="border-b border-pink/30 bg-pill-pink px-6 py-3 text-sm text-pink" role="alert">
            {error}
          </p>
        )}
        <Routes>
          <Route path="/" element={<Navigate replace to="/chat" />} />
          <Route path="/chat" element={<ChatPage usuario={usuario} />} />
          <Route
            path="/menu"
            element={
              <MenuPorRolPage
                aprobarAclaracion={aprobarAclaracionPorId}
                obtenerAclaraciones={cargarAclaraciones}
                obtenerMenu={cargarMenu}
                usuario={usuario}
              />
            }
          />
          <Route path="*" element={<Navigate replace to="/chat" />} />
        </Routes>
      </section>
    </main>
  );
}

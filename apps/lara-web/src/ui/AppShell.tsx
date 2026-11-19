import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Calendar,
  ChartNoAxesColumn,
  Database,
  Menu,
  Network,
  PanelLeft,
  TextAlignStart,
  Users,
  Waypoints,
  Wrench,
  X,
} from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { IniciarSesion } from "../application/use-cases/IniciarSesion";
import { adaptadores, usarMocks } from "../infrastructure/composition";
import { DialogoApariencia } from "./apariencia/DialogoApariencia";
import { AvisoCarga, Esqueleto, EsqueletoTabla } from "./components/Esqueleto";
import { AccesoDenegado } from "./components/AccesoDenegado";
import { IconButton } from "./components/IconButton";
import { IndicadorMock } from "./components/IndicadorMock";
import { LaraLogo } from "./components/LaraLogo";
import { PageLayout } from "./components/PageLayout";
import { idBarraLateral, Sidebar } from "./components/Sidebar";
import { ChatPage } from "./ChatPage";
import { FinanzasPage } from "./FinanzasPage";
import { LoginPage } from "./LoginPage";
import { MenuUsuario } from "./MenuUsuario";
import { NavLateral } from "./NavLateral";
import { iconoNav, type EntradaNav } from "./navegacion";
import { RielNav } from "./RielNav";
import { ChatSessionsProvider, useChatSessions } from "./useChatSessions";
import { useHasRole } from "./useHasRole";
import { focoAplicable, type DestinoFocoBarra } from "./focoBarra";
import { tituloDeRuta, useTituloDocumento } from "./tituloDocumento";
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
const UsuariosRolesPage = lazy(() =>
  import("./UsuariosRolesPage").then((m) => ({ default: m.UsuariosRolesPage })),
);

const iniciarSesion = new IniciarSesion(adaptadores.auth);
const idContenidoPrincipal = "contenido-principal";

/**
 * Autentica al usuario (login propio de Lara + Keycloak) y compone el shell con sus vistas.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Pantalla de login propia, sidebar de la maqueta y una ruta por vista.
 * @modified Daniel Tovar 2026-09-30 Shell sobre PageLayout, drawer de navegación bajo 980px, landmarks y carga diferida.
 * @modified Daniel Tovar 2026-10-01 Oculta del DOM las secciones AGENTES, IDENTIDAD y PERSONAL según los roles del usuario.
 * @modified Daniel Tovar 2026-10-02 Protege las rutas de esas secciones: sin el rol muestra AccesoDenegado.
 * @modified Daniel Tovar 2026-10-10 Renombra identificadores de Keycloak según ADR-0006.
 * @modified Daniel Tovar 2026-10-10 El shell usa PageLayout libre: sin el marco de 32/24/32 px alrededor de la barra lateral.
 * @modified Daniel Tovar 2026-10-10 Botón y diálogo "Apariencia" en el pie de la barra lateral.
 * @modified Daniel Tovar 2026-10-10 Skip link, contenido principal enfocable y título del documento por vista.
 * @modified Daniel Tovar 2026-10-10 Adaptadores desde el composition root e indicador MOCK.
 * @modified Daniel Tovar 2026-10-10 Esqueletos de carga y reintento en Recientes.
 * @modified Daniel Tovar 2026-10-10 Las rutas viejas de Trading MX y Trading USA redirigen a Inversiones.
 * @modified Daniel Tovar 2026-10-10 El foco al contraer/mostrar la barra ya no se pierde si un efecto viejo corre antes (carrera del montaje).
 * @modified Daniel Tovar 2026-11-19 Divide el shell en NavLateral, RielNav y MenuUsuario; el menú de usuario deja de declarar roles de menú.
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

function CargandoVista() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <AvisoCarga texto="Cargando vista…" />
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Esqueleto className="h-7 w-1/3" />
        <Esqueleto className="h-4 w-1/2" />
      </div>
      <EsqueletoTabla />
    </div>
  );
}

function AppShellLayout({ usuario }: AppShellLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const estrecha = useVistaEstrecha();
  const { setActiveSessionId } = useChatSessions();
  const [error, setError] = useState<string | null>(null);
  const [barraVisible, setBarraVisible] = useState(true);
  const [rutaDrawer, setRutaDrawer] = useState<string | null>(null);
  const [aparienciaAbierta, setAparienciaAbierta] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  useTituloDocumento(tituloDeRuta(pathname));
  const puedeVerAgentes = useHasRole(usuario, ["ver_agentes", "admin"]);
  const puedeVerIdentidad = useHasRole(usuario, ["ver_identidad", "admin"]);
  const puedeVerPersonal = useHasRole(usuario, ["ver-finanzas", "admin"]);

  const enFinanzas = pathname === "/finanzas" || pathname.startsWith("/finanzas/");

  const itemsPersonal: EntradaNav[] = puedeVerPersonal
    ? [
        {
          activo: enFinanzas,
          etiqueta: "Finanzas",
          icono: <ChartNoAxesColumn aria-hidden="true" className={iconoNav} />,
          ruta: "/finanzas",
        },
        {
          etiqueta: "Gastos fijos",
          icono: <Calendar aria-hidden="true" className={iconoNav} />,
          ruta: "/gastos-fijos",
        },
      ]
    : [];

  const itemsLaboratorio: EntradaNav[] = [
    ...(puedeVerAgentes
      ? [
          {
            etiqueta: "Agentes",
            icono: <Network aria-hidden="true" className={iconoNav} />,
            ruta: "/agentes",
          },
          {
            etiqueta: "Base de datos",
            icono: <Database aria-hidden="true" className={iconoNav} />,
            ruta: "/base-de-datos",
          },
          {
            etiqueta: "Memoria vectorizada",
            icono: <Waypoints aria-hidden="true" className={iconoNav} />,
            ruta: "/memoria",
          },
          {
            etiqueta: "Herramientas MCP",
            icono: <Wrench aria-hidden="true" className={iconoNav} />,
            ruta: "/herramientas",
          },
        ]
      : []),
    ...(puedeVerIdentidad
      ? [
          {
            etiqueta: "Menú por rol",
            icono: <TextAlignStart aria-hidden="true" className={iconoNav} />,
            ruta: "/menu-por-rol",
          },
          {
            etiqueta: "Usuarios y roles",
            icono: <Users aria-hidden="true" className={iconoNav} />,
            ruta: "/usuarios",
          },
        ]
      : []),
  ];

  const enLaboratorio = itemsLaboratorio.some((item) => pathname === item.ruta);

  const panelNav = useRef<HTMLElement | null>(null);
  const botonMenu = useRef<HTMLButtonElement | null>(null);
  const botonContraer = useRef<HTMLButtonElement | null>(null);
  const botonMostrar = useRef<HTMLButtonElement | null>(null);
  const botonUsuario = useRef<HTMLButtonElement | null>(null);
  const contenidoPrincipal = useRef<HTMLElement | null>(null);
  const aparienciaEstabaAbierta = useRef(false);
  const navEstabaAbierta = useRef(false);
  const focoPendiente = useRef<DestinoFocoBarra | null>(null);

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
    // El botón "Configuración" vive dentro del menú de usuario, que se cierra al abrir el diálogo:
    // el foco vuelve al botón de usuario (su trigger), no al ítem del menú ya desmontado.
    if (aparienciaEstabaAbierta.current && !aparienciaAbierta) {
      botonUsuario.current?.focus();
    }
    aparienciaEstabaAbierta.current = aparienciaAbierta;
  }, [aparienciaAbierta]);

  useEffect(() => {
    const destino = focoAplicable(focoPendiente.current, barraVisible);
    if (destino === null) {
      return;
    }
    focoPendiente.current = null;
    (destino === "contraer" ? botonContraer : botonMostrar).current?.focus();
  }, [barraVisible]);

  function alternarBarra(visible: boolean) {
    focoPendiente.current = visible ? "contraer" : "mostrar";
    setBarraVisible(visible);
  }

  const cerrarMenuUsuario = useCallback(() => setMenuUsuarioAbierto(false), []);

  function irALaboratorio() {
    setMenuUsuarioAbierto(false);
    setRutaDrawer(null);
    if (itemsLaboratorio[0]) {
      navigate(itemsLaboratorio[0].ruta);
    }
  }

  function iniciarChatNuevo() {
    setError(null);
    setActiveSessionId(null);
    setRutaDrawer(null);
    navigate("/chat");
  }

  async function cerrarSesion() {
    try {
      await adaptadores.auth.logout();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "No se pudo cerrar sesión.");
    }
  }

  const protegido = (permitido: boolean, elemento: ReactNode) =>
    permitido ? elemento : <AccesoDenegado />;

  const enRuta = (ruta: string) => pathname === ruta;
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
        <span className="text-brand font-semibold">Lara</span>
        <IndicadorMock activo={usarMocks} />
      </div>
    </header>
  );

  return (
    <PageLayout
      cabecera={barraSuperior || undefined}
      className="h-dvh bg-bg font-sans text-text"
      desplazable={false}
      libre
    >
      <a
        className="sr-only z-50 rounded-button bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:inline-flex focus:min-h-11 focus:items-center"
        href={`#${idContenidoPrincipal}`}
        onClick={(event) => {
          event.preventDefault();
          contenidoPrincipal.current?.focus();
        }}
      >
        Saltar al contenido principal
      </a>
      <div className="flex min-h-0 min-w-0 flex-1">
        {barraCompleta ? (
          <Sidebar abierto={drawerActivo} drawer={estrecha} onCerrar={cerrarNav} panelRef={panelNav}>
            <div className="flex shrink-0 items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <LaraLogo />
                <span className="text-brand font-semibold">Lara</span>
                <IndicadorMock activo={usarMocks} />
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

            <NavLateral
              enLaboratorio={enLaboratorio}
              enRuta={enRuta}
              itemsLaboratorio={itemsLaboratorio}
              itemsPersonal={itemsPersonal}
              onNuevoChat={iniciarChatNuevo}
              onVolverAlChat={() => navigate("/chat")}
              pathname={pathname}
            />

            <MenuUsuario
              abierto={menuUsuarioAbierto}
              botonUsuarioRef={botonUsuario}
              onAbrirApariencia={() => {
                setMenuUsuarioAbierto(false);
                setAparienciaAbierta(true);
              }}
              onAlternar={() => setMenuUsuarioAbierto((abierto) => !abierto)}
              onCerrar={cerrarMenuUsuario}
              onCerrarSesion={() => void cerrarSesion()}
              onLaboratorio={itemsLaboratorio.length > 0 ? irALaboratorio : undefined}
              usuario={usuario}
            />
          </Sidebar>
        ) : (
          <RielNav
            botonMostrarRef={botonMostrar}
            enLaboratorio={enLaboratorio}
            enRuta={enRuta}
            itemsLaboratorio={itemsLaboratorio}
            itemsPersonal={itemsPersonal}
            onMostrar={() => alternarBarra(true)}
          />
        )}

        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
          id={idContenidoPrincipal}
          ref={contenidoPrincipal}
          tabIndex={-1}
        >
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
              <Route path="/agentes" element={protegido(puedeVerAgentes, <AgentesPage />)} />
              <Route
                path="/base-de-datos"
                element={protegido(
                  puedeVerAgentes,
                  <BaseDeDatosPage baseDatos={adaptadores.baseDatos} usuario={usuario} />,
                )}
              />
              <Route
                path="/memoria"
                element={protegido(puedeVerAgentes, <MemoriaPage memoria={adaptadores.memoria} />)}
              />
              <Route path="/herramientas" element={protegido(puedeVerAgentes, <HerramientasPage />)} />
              <Route
                path="/menu-por-rol"
                element={protegido(
                  puedeVerIdentidad,
                  <MenuPorRolPage menuPorRol={adaptadores.menuPorRol} usuario={usuario} />,
                )}
              />
              <Route
                path="/usuarios"
                element={protegido(
                  puedeVerIdentidad,
                  <UsuariosRolesPage usuariosRealm={adaptadores.usuariosRealm} />,
                )}
              />
              <Route
                path="/gastos-fijos"
                element={protegido(
                  puedeVerPersonal,
                  <GastosFijosPage gastosFijos={adaptadores.gastosFijos} />,
                )}
              />
              <Route
                path="/finanzas"
                element={protegido(puedeVerPersonal, <Navigate replace to="/finanzas/resumen" />)}
              />
              <Route
                path="/finanzas/pagos"
                element={protegido(puedeVerPersonal, <Navigate replace to="/finanzas/tarjetas" />)}
              />
              <Route
                path="/finanzas/trading-mx"
                element={protegido(puedeVerPersonal, <Navigate replace to="/finanzas/inversiones" />)}
              />
              <Route
                path="/finanzas/trading-usa"
                element={protegido(
                  puedeVerPersonal,
                  <Navigate replace to="/finanzas/inversiones?mercado=usa" />,
                )}
              />
              <Route path="/finanzas/:tab" element={protegido(puedeVerPersonal, <FinanzasPage />)} />
              <Route path="*" element={<Navigate replace to="/chat" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {aparienciaAbierta && <DialogoApariencia onCerrar={() => setAparienciaAbierta(false)} />}
    </PageLayout>
  );
}

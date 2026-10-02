import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OrigenSesion, SesionChat } from "../domain/SesionChat";
import type { Mensaje } from "../domain/Mensaje";
import type { ActualizacionStreaming } from "../application/ports/AgentePort";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { AdkAgenteAdapter } from "../infrastructure/adapters/AdkAgenteAdapter";
import { EnviarMensaje } from "../application/use-cases/EnviarMensaje";

const agente = new AdkAgenteAdapter(keycloakAuthAdapter);
const casoEnviarMensaje = new EnviarMensaje(keycloakAuthAdapter, agente);

interface ChatSessionsValue {
  activeSessionId: string | null;
  finanzasSessionId: string | null;
  historyError: string | null;
  isLoadingHistory: boolean;
  refreshSessions: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  sessions: SesionChat[];
  setActiveSessionId: (sessionId: string | null) => void;
  setFinanzasSessionId: (sessionId: string | null) => void;
  obtenerSesion: (sessionId: string) => Promise<Mensaje[]>;
  enviarMensaje: (
    texto: string,
    sessionId: string | null,
    onUpdate: (update: ActualizacionStreaming) => void,
    modeloId: string,
    origen?: OrigenSesion,
  ) => Promise<string>;
}

interface ChatSessionsProviderProps {
  children: ReactNode;
  userId: string;
}

const ChatSessionsContext = createContext<ChatSessionsValue | null>(null);

/**
 * Comparte el historial y la sesión activa entre el shell lateral y el chat.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Comparte el puerto y caso de uso de chat embebido.
 * @modified Daniel Tovar 2026-09-30 Separa la sesión del panel de finanzas y la oculta de Recientes.
 * @modified Daniel Tovar 2026-10-01 enviarMensaje exige el modeloId elegido en el chat.
 */
export function ChatSessionsProvider({ children, userId }: ChatSessionsProviderProps) {
  const [todasLasSesiones, setTodasLasSesiones] = useState<SesionChat[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [finanzasSessionId, setFinanzasSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const listadas = await agente.listarSesiones(userId);
      setTodasLasSesiones(listadas);
      const ultimaDeFinanzas = listadas.find((sesion) => sesion.origen === "finanzas");
      setFinanzasSessionId((actual) => actual ?? ultimaDeFinanzas?.id ?? null);
    } catch (reason: unknown) {
      const message =
        reason instanceof Error ? reason.message : "No se pudo cargar el historial.";
      setHistoryError(message);
      throw reason;
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);
  const obtenerSesion = useCallback(
    (sessionId: string) => agente.obtenerSesion(userId, sessionId),
    [userId],
  );
  const enviarMensaje = useCallback(
    (
      texto: string,
      sessionId: string | null,
      onUpdate: (update: ActualizacionStreaming) => void,
      modeloId: string,
      origen?: OrigenSesion,
    ) => casoEnviarMensaje.ejecutar(texto, sessionId, onUpdate, modeloId, origen),
    [],
  );
  const sessions = useMemo(
    () => todasLasSesiones.filter((sesion) => sesion.origen !== "finanzas"),
    [todasLasSesiones],
  );

  useEffect(() => {
    void refreshSessions().catch((reason: unknown) => {
      setHistoryError(
        reason instanceof Error ? reason.message : "No se pudo cargar el historial.",
      );
    });
  }, [refreshSessions]);

  return (
    <ChatSessionsContext.Provider
      value={{
        activeSessionId,
        finanzasSessionId,
        historyError,
        isLoadingHistory,
        obtenerSesion,
        refreshSessions,
        enviarMensaje,
        selectSession,
        sessions,
        setActiveSessionId,
        setFinanzasSessionId,
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
}

/**
 * Accede al historial compartido entre las vistas de chat y menú.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Comparte operaciones ADK para el chat financiero.
 */
export function useChatSessions(): ChatSessionsValue {
  const context = useContext(ChatSessionsContext);
  if (!context) {
    throw new Error("useChatSessions debe usarse dentro de ChatSessionsProvider.");
  }
  return context;
}

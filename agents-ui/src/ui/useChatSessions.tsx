import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SesionChat } from "../domain/SesionChat";
import { keycloakAuthAdapter } from "../infrastructure/adapters/KeycloakAuthAdapter";
import { AdkAgenteAdapter } from "../infrastructure/adapters/AdkAgenteAdapter";

const agente = new AdkAgenteAdapter(keycloakAuthAdapter);

interface ChatSessionsValue {
  activeSessionId: string | null;
  historyError: string | null;
  isLoadingHistory: boolean;
  refreshSessions: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  sessions: SesionChat[];
  setActiveSessionId: (sessionId: string | null) => void;
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
 * @modified Daniel 2026-09-30 Crea la sesión al enviar el primer mensaje.
 */
export function ChatSessionsProvider({ children, userId }: ChatSessionsProviderProps) {
  const [sessions, setSessions] = useState<SesionChat[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      setSessions(await agente.listarSesiones(userId));
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
        historyError,
        isLoadingHistory,
        refreshSessions,
        selectSession,
        sessions,
        setActiveSessionId,
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
 * @modified Daniel 2026-09-30 Comparte el inicio diferido de sesiones.
 */
export function useChatSessions(): ChatSessionsValue {
  const context = useContext(ChatSessionsContext);
  if (!context) {
    throw new Error("useChatSessions debe usarse dentro de ChatSessionsProvider.");
  }
  return context;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" activa los adaptadores mock con datos ficticios (ver .env.example). */
  readonly VITE_USE_MOCKS?: string;
}

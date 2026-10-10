import { Lock } from "lucide-react";
import { claseFoco } from "./components/foco";
import { LaraLogo } from "./components/LaraLogo";
import { Pill } from "./components/Pill";

interface LoginPageProps {
  comprobando: boolean;
  error: string | null;
  onLogin: () => void;
}

const datosLogin = [
  ["Realm", "lab"],
  ["Client", "lara-web"],
  ["Flujo", "PKCE S256"],
] as const;

const areas = [
  { nombre: "Agentes", color: "text-accent" },
  { nombre: "Identidad", color: "text-highlight" },
  { nombre: "Memoria", color: "text-faint" },
  { nombre: "Finanzas", color: "text-text-2" },
] as const;

/**
 * Pantalla de login de Lara: un solo botón que redirige a Keycloak (sin formulario propio).
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Scroll propio en ventanas bajas (body no desplaza) y chip Finanzas con contraste AA.
 * @modified Daniel Tovar 2026-10-10 Renombra identificadores de Keycloak según ADR-0006.
 */
export function LoginPage({ comprobando, error, onLogin }: LoginPageProps) {
  return (
    <div className="h-dvh overflow-y-auto bg-bg font-sans text-text">
    <div className="grid min-h-full grid-cols-1 shell:grid-cols-[1.1fr_1fr]">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-100 flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <Pill className="self-start" mono>
              LOCAL
            </Pill>
            <h1 className="m-0 text-3xl font-semibold tracking-tight">Inicia sesión</h1>
            <p className="m-0 text-body text-muted">
              Usa tu cuenta del realm lab. Te llevamos a Keycloak y regresas aquí con tu sesión
              lista.
            </p>
          </div>
          <button
            className={`flex min-h-12 items-center justify-center gap-2.5 rounded-button bg-accent text-body font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${claseFoco}`}
            disabled={comprobando}
            onClick={onLogin}
            type="button"
          >
            <Lock aria-hidden="true" className="size-4.5" />
            Continuar con Keycloak
          </button>
          {comprobando && (
            <p className="m-0 text-compact text-muted" role="status">
              Comprobando tu sesión…
            </p>
          )}
          {error && (
            <p className="m-0 rounded-card border border-border bg-surface px-4 py-3 text-compact text-danger" role="alert">
              {error}
            </p>
          )}
          <dl className="m-0 flex flex-col overflow-hidden rounded-button border border-border">
            {datosLogin.map(([etiqueta, valor]) => (
              <div
                className="flex justify-between border-b border-border px-4 py-3 text-compact last:border-b-0"
                key={etiqueta}
              >
                <dt className="text-muted">{etiqueta}</dt>
                <dd className="m-0 font-mono">{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 text-compact leading-normal text-faint">
            ¿No carga el login? Revisa que Keycloak esté arriba en{" "}
            <span className="font-mono text-accent">localhost:8080</span>.
          </p>
        </div>
      </main>
      <aside className="hidden flex-col justify-between border-l border-border bg-surface p-14 shell:flex">
        <div className="flex items-center gap-3">
          <LaraLogo tamano={32} />
          <span className="text-stat font-semibold tracking-tight">Lara</span>
        </div>
        <div className="flex max-w-135 flex-col gap-5">
          <p className="m-0 text-display font-medium leading-display tracking-tight">
            Tus agentes, tu memoria y tus datos en un solo lugar.
          </p>
          <p className="m-0 text-heading leading-body text-muted">
            Platica con el orquestador, revisa tu lab de identidad y lleva tus finanzas
            personales, todo corriendo en tu PC.
          </p>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            {areas.map((area) => (
              <li
                className={`rounded-pill bg-surface-active px-3.5 py-1.5 text-compact ${area.color}`}
                key={area.nombre}
              >
                {area.nombre}
              </li>
            ))}
          </ul>
        </div>
        <p className="m-0 font-mono text-xs text-faint">labs-demo · entorno LOCAL</p>
      </aside>
    </div>
    </div>
  );
}

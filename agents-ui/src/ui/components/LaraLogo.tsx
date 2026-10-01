interface LaraLogoProps {
  className?: string;
  tamano?: number;
  /** Solo la L, sin el círculo (avatar del agente en el chat). */
  soloL?: boolean;
}

/**
 * Logo de Lara (círculo con una L) que toma su color de currentColor.
 * @author Daniel Tovar
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Variante soloL: solo el path de la L, sin círculo.
 */
export function LaraLogo({ className = "text-accent", tamano = 26, soloL = false }: LaraLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={tamano}
      viewBox="0 0 28 28"
      width={tamano}
    >
      {!soloL && <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />}
      <path
        d="M10 8v12h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={soloL ? 2.6 : 2.4}
      />
    </svg>
  );
}

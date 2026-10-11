import { useEffect } from "react";
import { pestanasFinanzas } from "./finanzasPestanas";

const titulosPorRuta: Record<string, string> = {
  "/chat": "Chat",
  "/estado": "Estado del lab",
  "/agentes": "Agentes",
  "/base-de-datos": "Base de datos",
  "/memoria": "Memoria vectorizada",
  "/herramientas": "Herramientas MCP",
  "/menu-por-rol": "Menú por rol",
  "/usuarios": "Usuarios y roles",
  "/gastos-fijos": "Gastos fijos",
};

/** Título del documento de una ruta: lo más específico primero y "Lara" al final. */
export function tituloDeRuta(pathname: string): string {
  const pestana = pathname.startsWith("/finanzas/")
    ? pestanasFinanzas.find((candidata) => pathname === `/finanzas/${candidata.id}`)
    : undefined;
  const titulo = pestana ? `Finanzas · ${pestana.etiqueta}` : titulosPorRuta[pathname];
  return titulo ? `${titulo} · Lara` : "Lara";
}

/** Mantiene document.title al día para que lectores de pantalla y pestañas del navegador distingan las vistas. */
export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppShell } from "./ui/AppShell";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("No se encontró el elemento root de la aplicación.");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </StrictMode>,
);

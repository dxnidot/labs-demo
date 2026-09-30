import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatPage } from "./ui/ChatPage";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("No se encontró el elemento root de la aplicación.");
}

createRoot(root).render(
  <StrictMode>
    <ChatPage />
  </StrictMode>,
);

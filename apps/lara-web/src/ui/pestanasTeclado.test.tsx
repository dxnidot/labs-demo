// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { alPulsarTeclaEnPestanas } from "./pestanasTeclado";

const nombres = ["uno", "dos", "tres"];

function Pestanas() {
  const [activa, setActiva] = useState("uno");
  return (
    <div onKeyDown={alPulsarTeclaEnPestanas} role="tablist">
      {nombres.map((nombre) => (
        <button
          aria-selected={activa === nombre}
          key={nombre}
          onClick={() => setActiva(nombre)}
          role="tab"
          tabIndex={activa === nombre ? 0 : -1}
          type="button"
        >
          {nombre}
        </button>
      ))}
      <button type="button">fuera</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
});

function pulsar(tecla: string) {
  fireEvent.keyDown(document.activeElement as HTMLElement, { key: tecla });
}

describe("alPulsarTeclaEnPestanas", () => {
  it("ArrowRight y ArrowLeft avanzan y retroceden dando la vuelta, activando la pestaña", () => {
    render(<Pestanas />);
    screen.getByRole("tab", { name: "uno" }).focus();

    pulsar("ArrowRight");
    expect(screen.getByRole("tab", { name: "dos" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "dos" }));

    pulsar("ArrowLeft");
    pulsar("ArrowLeft");
    expect(screen.getByRole("tab", { name: "tres" }).getAttribute("aria-selected")).toBe("true");
  });

  it("Home y End saltan a la primera y a la última", () => {
    render(<Pestanas />);
    screen.getByRole("tab", { name: "uno" }).focus();

    pulsar("End");
    expect(screen.getByRole("tab", { name: "tres" }).getAttribute("aria-selected")).toBe("true");
    pulsar("Home");
    expect(screen.getByRole("tab", { name: "uno" }).getAttribute("aria-selected")).toBe("true");
  });

  it("mantiene el tabindex itinerante: solo la activa se alcanza con Tab", () => {
    render(<Pestanas />);
    screen.getByRole("tab", { name: "uno" }).focus();
    pulsar("ArrowRight");

    expect(screen.getAllByRole("tab").map((pestana) => pestana.getAttribute("tabindex"))).toEqual([
      "-1",
      "0",
      "-1",
    ]);
  });

  it("ignora otras teclas y el foco fuera de las pestañas", () => {
    render(<Pestanas />);
    screen.getByRole("tab", { name: "uno" }).focus();
    pulsar("a");
    expect(screen.getByRole("tab", { name: "uno" }).getAttribute("aria-selected")).toBe("true");

    screen.getByRole("button", { name: "fuera" }).focus();
    pulsar("ArrowRight");
    expect(screen.getByRole("tab", { name: "uno" }).getAttribute("aria-selected")).toBe("true");
  });
});

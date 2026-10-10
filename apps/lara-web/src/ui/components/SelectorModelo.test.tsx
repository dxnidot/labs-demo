// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Modelo } from "../../domain/Modelo";
import { SelectorModelo } from "./SelectorModelo";

const modelos: Modelo[] = [
  { id: "deepseek/deepseek-flash", nombre: "DeepSeek Flash", tier: "basic" },
  { id: "deepseek/deepseek-v4-pro", nombre: "DeepSeek V4 Pro", tier: "advanced" },
];

afterEach(() => {
  cleanup();
});

describe("SelectorModelo", () => {
  it("lista los modelos y marca el seleccionado", () => {
    render(
      <SelectorModelo modelos={modelos} onCambiar={() => {}} seleccionado="deepseek/deepseek-flash" />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("deepseek/deepseek-flash");
    expect(screen.getByRole("option", { name: "DeepSeek Flash" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "DeepSeek V4 Pro" })).toBeTruthy();
  });

  it("llama a onCambiar con el id del modelo elegido", () => {
    const onCambiar = vi.fn();
    render(
      <SelectorModelo modelos={modelos} onCambiar={onCambiar} seleccionado="deepseek/deepseek-flash" />,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "deepseek/deepseek-v4-pro" },
    });

    expect(onCambiar).toHaveBeenCalledWith("deepseek/deepseek-v4-pro");
  });
});

// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMinutosDesde } from "./useMinutosDesde";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMinutosDesde", () => {
  it("devuelve null sin fecha", () => {
    const { result } = renderHook(() => useMinutosDesde(null));

    expect(result.current).toBeNull();
  });

  it("cuenta minutos enteros y se actualiza solo cada 30 segundos", () => {
    const desde = new Date();
    const { result } = renderHook(() => useMinutosDesde(desde));
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe(1);
    act(() => vi.advanceTimersByTime(60_000 * 2));
    expect(result.current).toBe(3);
  });

  it("limpia el temporizador al desmontar", () => {
    const desde = new Date();
    const { unmount } = renderHook(() => useMinutosDesde(desde));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

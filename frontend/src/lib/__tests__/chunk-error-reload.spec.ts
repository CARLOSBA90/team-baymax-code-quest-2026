import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// El módulo guarda en memoria si ya pidió una recarga: cada test lo carga de cero.
function loadModule() {
  vi.resetModules();
  return import("@/lib");
}

let reload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  reload = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
});

describe("isChunkLoadError", () => {
  it.each([
    "Failed to fetch dynamically imported module: https://app/assets/RoadmapsPage-abc.js",
    "error loading dynamically imported module: https://app/assets/LoginPage-abc.js",
    "Importing a module script failed.",
    "Unable to preload CSS for /assets/index-abc.css",
  ])("reconoce %s", async (message) => {
    const { isChunkLoadError } = await loadModule();
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it("ignora otros errores y valores que no son Error", async () => {
    const { isChunkLoadError } = await loadModule();
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("reloadOnceForChunkError", () => {
  it("recarga, guarda la marca y deja la recarga como pendiente", async () => {
    const { CHUNK_RELOAD_STORAGE_KEY, isChunkReloadPending, reloadOnceForChunkError } =
      await loadModule();
    expect(isChunkReloadPending()).toBe(false);

    expect(reloadOnceForChunkError()).toBe(true);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(isChunkReloadPending()).toBe(true);
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)).not.toBeNull();
  });

  it("una segunda llamada en la misma página no vuelve a recargar", async () => {
    const { reloadOnceForChunkError } = await loadModule();

    reloadOnceForChunkError();
    expect(reloadOnceForChunkError()).toBe(true);

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("tras recargar, un fallo dentro de la ventana no recarga (evita el bucle)", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-24T10:00:00Z") });
    const first = await loadModule();
    first.reloadOnceForChunkError();

    // Página nueva tras la recarga: módulo limpio, misma sessionStorage.
    vi.advanceTimersByTime(first.CHUNK_RELOAD_WINDOW_MS - 1);
    const { isChunkReloadPending, reloadOnceForChunkError } = await loadModule();

    expect(reloadOnceForChunkError()).toBe(false);
    expect(isChunkReloadPending()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("pasada la ventana vuelve a recargar", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-24T10:00:00Z") });
    const first = await loadModule();
    first.reloadOnceForChunkError();

    vi.advanceTimersByTime(first.CHUNK_RELOAD_WINDOW_MS);
    const { reloadOnceForChunkError } = await loadModule();

    expect(reloadOnceForChunkError()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("si sessionStorage falla recarga igualmente, pero solo una vez", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { reloadOnceForChunkError } = await loadModule();

    expect(reloadOnceForChunkError()).toBe(true);
    reloadOnceForChunkError();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

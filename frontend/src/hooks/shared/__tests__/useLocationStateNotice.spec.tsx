import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import {
  createMemoryRouter,
  type InitialEntry,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useLocationStateNotice } from "@/hooks";

function parseMessage(state: unknown): string | null {
  if (typeof state !== "object" || state === null) return null;
  const { message } = state as { message?: unknown };
  return typeof message === "string" ? message : null;
}

function Probe() {
  const notice = useLocationStateNotice(parseMessage);
  const location = useLocation();
  return (
    <>
      <p data-testid="notice">{notice ?? "sin aviso"}</p>
      <p data-testid="state">{JSON.stringify(location.state ?? null)}</p>
    </>
  );
}

function renderProbe(initialEntries: InitialEntry[], { strict = false } = {}) {
  const router = createMemoryRouter([{ path: "*", element: <Probe /> }], { initialEntries });
  const replaces: string[] = [];
  router.subscribe((state) => {
    if (state.historyAction === "REPLACE") replaces.push(state.location.key);
  });
  const app = <RouterProvider router={router} />;
  render(strict ? <StrictMode>{app}</StrictMode> : app);
  return { router, replaces };
}

const notice = () => screen.getByTestId("notice");

describe("useLocationStateNotice", () => {
  it("devuelve el valor parseado y lo conserva tras limpiar el state con replace", () => {
    const { router, replaces } = renderProbe([
      { pathname: "/rutas", state: { message: "Ruta «A» eliminada" } },
    ]);

    expect(notice()).toHaveTextContent("Ruta «A» eliminada");
    expect(router.state.location.state).toBeNull();
    expect(router.state.location.pathname).toBe("/rutas");
    expect(replaces).toHaveLength(1);
    expect(screen.getByTestId("state")).toHaveTextContent("null");
  });

  it("conserva search y hash al limpiar", () => {
    const { router } = renderProbe([
      { pathname: "/rutas", search: "?status=paused", hash: "#x", state: { message: "Hola" } },
    ]);

    expect(router.state.location.search).toBe("?status=paused");
    expect(router.state.location.hash).toBe("#x");
    expect(notice()).toHaveTextContent("Hola");
  });

  it("otra navegación lo descarta y atrás/adelante no lo recupera", async () => {
    const { router } = renderProbe([{ pathname: "/rutas", state: { message: "Hola" } }]);
    expect(notice()).toHaveTextContent("Hola");

    await act(() => router.navigate("/rutas?status=paused", { replace: true }));
    expect(notice()).toHaveTextContent("sin aviso");

    await act(() => router.navigate("/otra"));
    await act(() => router.navigate(-1));
    expect(notice()).toHaveTextContent("sin aviso");
  });

  it("una llegada nueva con otro state muestra el nuevo valor", async () => {
    const { router } = renderProbe([{ pathname: "/rutas", state: { message: "Primero" } }]);

    await act(() => router.navigate("/rutas", { state: { message: "Segundo" } }));

    expect(notice()).toHaveTextContent("Segundo");
    expect(router.state.location.state).toBeNull();
  });

  it("si parse devuelve null no hay aviso ni replace", () => {
    const { router, replaces } = renderProbe([{ pathname: "/rutas", state: { foo: 1 } }]);

    expect(notice()).toHaveTextContent("sin aviso");
    expect(replaces).toHaveLength(0);
    expect(router.state.location.state).toEqual({ foo: 1 });
  });

  it("en StrictMode limpia con un solo replace", () => {
    const { replaces } = renderProbe([{ pathname: "/rutas", state: { message: "Hola" } }], {
      strict: true,
    });

    expect(replaces).toHaveLength(1);
    expect(notice()).toHaveTextContent("Hola");
  });
});

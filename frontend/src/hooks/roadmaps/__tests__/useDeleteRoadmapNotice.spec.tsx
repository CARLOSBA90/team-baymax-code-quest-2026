import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useDeleteRoadmapNotice } from "@/hooks";
import { renderWithProviders } from "@/test/renderWithProviders";

function Probe() {
  const { message, show } = useDeleteRoadmapNotice();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <p data-testid="notice">{message ?? "sin aviso"}</p>
      <p data-testid="location">{`${location.pathname}${location.search}`}</p>
      <button type="button" onClick={() => show("Ruta «A» eliminada")}>
        Aviso A
      </button>
      <button type="button" onClick={() => show("Ruta «B» eliminada")}>
        Aviso B
      </button>
      <button type="button" onClick={() => navigate("/rutas?status=paused", { replace: true })}>
        Filtrar
      </button>
      <button type="button" onClick={() => navigate("/otra")}>
        Ir
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante
      </button>
    </>
  );
}

function renderProbe() {
  renderWithProviders(<Probe />, { route: "/rutas" });
  return userEvent.setup();
}

function notice() {
  return screen.getByTestId("notice");
}

describe("useDeleteRoadmapNotice", () => {
  it("empieza sin aviso", () => {
    renderProbe();
    expect(notice()).toHaveTextContent("sin aviso");
  });

  it("show muestra el mensaje en la entrada actual", async () => {
    const user = renderProbe();
    await user.click(screen.getByRole("button", { name: "Aviso A" }));
    expect(notice()).toHaveTextContent("Ruta «A» eliminada");
  });

  it("un aviso nuevo reemplaza al anterior", async () => {
    const user = renderProbe();
    await user.click(screen.getByRole("button", { name: "Aviso A" }));
    await user.click(screen.getByRole("button", { name: "Aviso B" }));
    expect(notice()).toHaveTextContent("Ruta «B» eliminada");
    expect(notice()).not.toHaveTextContent("«A»");
  });

  it("se oculta al reemplazar la entrada (cambio de filtro)", async () => {
    const user = renderProbe();
    await user.click(screen.getByRole("button", { name: "Aviso A" }));
    await user.click(screen.getByRole("button", { name: "Filtrar" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/rutas?status=paused");
    expect(notice()).toHaveTextContent("sin aviso");
  });

  it("no reaparece al volver con atrás/adelante a la entrada donde se mostró", async () => {
    const user = renderProbe();
    await user.click(screen.getByRole("button", { name: "Aviso A" }));
    await user.click(screen.getByRole("button", { name: "Ir" }));
    expect(notice()).toHaveTextContent("sin aviso");

    await user.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/rutas");
    expect(notice()).toHaveTextContent("sin aviso");

    await user.click(screen.getByRole("button", { name: "Adelante" }));
    await user.click(screen.getByRole("button", { name: "Atrás" }));
    expect(notice()).toHaveTextContent("sin aviso");
  });

  it("tras ocultarse, un aviso nuevo se muestra en la nueva entrada", async () => {
    const user = renderProbe();
    await user.click(screen.getByRole("button", { name: "Aviso A" }));
    await user.click(screen.getByRole("button", { name: "Filtrar" }));
    await user.click(screen.getByRole("button", { name: "Aviso B" }));
    expect(notice()).toHaveTextContent("Ruta «B» eliminada");
  });
});

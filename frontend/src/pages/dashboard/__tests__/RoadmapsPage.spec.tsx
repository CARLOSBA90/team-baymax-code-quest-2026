import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ASSESSMENT_COMPLETED_STATE } from "@/lib";
import { RoadmapsPage } from "@/pages";
import { renderWithProviders } from "@/test/renderWithProviders";

const SUCCESS_NOTICE =
  "¡Cuestionario completado! Guardamos tus respuestas; pronto verás aquí tu ruta recomendada.";

/** Harness de `design.md`: remontaje en la misma entrada (≈ recarga) y atrás/adelante. */
function Harness() {
  const [mountKey, setMountKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<RoadmapsPage key={mountKey} />} />
        <Route
          path="/dashboard/roadmaps/new"
          element={
            <>
              <p>Cuestionario</p>
              <button type="button" onClick={() => navigate("/dashboard/roadmaps")}>
                Salir
              </button>
            </>
          }
        />
      </Routes>
      <p data-testid="location-state">{JSON.stringify(location.state ?? null)}</p>
      <button type="button" onClick={() => setMountKey((key) => key + 1)}>
        Remontar
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante
      </button>
      <button
        type="button"
        onClick={() => navigate("/dashboard/roadmaps", { state: ASSESSMENT_COMPLETED_STATE })}
      >
        Completar
      </button>
    </>
  );
}

/** Por defecto la entrada previa es el cuestionario; con `previous` se elige otra. */
function renderHarness(previous = "/dashboard/roadmaps/new") {
  renderWithProviders(<Harness />, {
    initialEntries: [
      previous,
      { pathname: "/dashboard/roadmaps", state: ASSESSMENT_COMPLETED_STATE },
    ],
    initialIndex: 1,
  });
  return userEvent.setup();
}

/** Espera a que `RoadmapsPage` limpie el `state` de la entrada con `replace`. */
async function expectStateCleared() {
  await waitFor(() => expect(screen.getByTestId("location-state")).toHaveTextContent("null"));
}

describe("RoadmapsPage", () => {
  it("muestra el encabezado Mis Rutas y el subtítulo", () => {
    renderWithProviders(<RoadmapsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
    expect(
      screen.getByText("Aquí aparecerán las rutas de aprendizaje que crees."),
    ).toBeInTheDocument();
  });

  it("no renderiza main propio ni la clase .nebula", () => {
    const { container } = renderWithProviders(<RoadmapsPage />);
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(container.querySelector(".nebula")).toBeNull();
  });

  it("muestra el CTA del estado vacío y ningún dato de usuario/logout", () => {
    renderWithProviders(<RoadmapsPage />);
    expect(screen.getByRole("button", { name: "Crear mi primera ruta" })).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  describe("aviso de cuestionario completado", () => {
    it("sin state no muestra el aviso", () => {
      renderWithProviders(<RoadmapsPage />, { route: "/dashboard/roadmaps" });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("con el state de cuestionario completado muestra el aviso y después limpia el state", async () => {
      renderHarness();

      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Aún no tienes rutas" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Crear mi primera ruta" })).toBeInTheDocument();

      await expectStateCleared();
      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);
    });

    it.each([
      ["{ foo: 1 }", { foo: 1 }],
      ['"x"', "x"],
      ['{ assessmentCompleted: "true" }', { assessmentCompleted: "true" }],
    ])("con un state de otra forma (%s) no muestra el aviso", (_label, state) => {
      renderWithProviders(<RoadmapsPage />, {
        route: { pathname: "/dashboard/roadmaps", state },
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("al remontar sobre la misma entrada (≈ recarga) no vuelve a mostrar el aviso", async () => {
      const user = renderHarness();

      expect(screen.getByRole("status")).toBeInTheDocument();
      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Remontar" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("con atrás y adelante no vuelve a mostrar el aviso", async () => {
      const user = renderHarness();

      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.getByText("Cuestionario")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Adelante" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByTestId("location-state")).toHaveTextContent("null");
    });

    it("con atrás hasta otra entrada de Mis Rutas (sin remontar) y adelante no muestra el aviso", async () => {
      // Flujo real: Mis Rutas → Crear mi primera ruta → enviar (replace) → Atrás.
      const user = renderHarness("/dashboard/roadmaps");

      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);
      await expectStateCleared();
      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);

      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Adelante" }));
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("si llega el state con la página ya montada, muestra el aviso y limpia el state", async () => {
      const user = renderHarness("/dashboard/roadmaps");
      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Completar" }));

      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);
      await expectStateCleared();
      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS_NOTICE);
    });

    it("tras Crear mi primera ruta y volver sin state no muestra el aviso", async () => {
      const user = renderHarness();

      expect(screen.getByRole("status")).toBeInTheDocument();
      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Crear mi primera ruta" }));
      expect(screen.getByText("Cuestionario")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Salir" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});

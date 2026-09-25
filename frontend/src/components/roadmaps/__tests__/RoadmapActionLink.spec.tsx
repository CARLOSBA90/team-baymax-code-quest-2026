import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoadmapActionLink } from "@/components/roadmaps";
import { buildRoadmapSummary } from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapStatus } from "@/types";

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

const ACTIONS: [RoadmapStatus, string][] = [
  ["IN_PROGRESS", "Continuar"],
  ["PAUSED", "Reanudar"],
  ["COMPLETED", "Ver ruta"],
  ["NOT_STARTED", "Empezar"],
];

describe("RoadmapActionLink", () => {
  it("incluye el nombre de la ruta en el nombre accesible y apunta al detalle", () => {
    const roadmap = buildRoadmapSummary({
      id: "rm-frontend-react",
      name: "Frontend moderno con React",
      status: "IN_PROGRESS",
    });
    renderWithProviders(<RoadmapActionLink roadmap={roadmap} />);

    const link = screen.getByRole("link", { name: "Continuar Frontend moderno con React" });
    expect(link).toHaveAttribute("href", "/dashboard/roadmaps/rm-frontend-react");
  });

  it.each(ACTIONS)("%s muestra '%s'", (status, label) => {
    renderWithProviders(<RoadmapActionLink roadmap={buildRoadmapSummary({ status })} />);

    expect(screen.getByRole("link", { name: `${label} Ruta de prueba` })).toBeInTheDocument();
  });

  it("'Reanudar' solo navega al detalle", async () => {
    const user = userEvent.setup();
    const roadmap = buildRoadmapSummary({
      id: "rm-backend-nest",
      name: "Backend con Node y NestJS",
      status: "PAUSED",
    });
    renderWithProviders(
      <>
        <Routes>
          <Route path="/dashboard/roadmaps" element={<RoadmapActionLink roadmap={roadmap} />} />
          <Route path="/dashboard/roadmaps/:roadmapId" element={<p>Detalle</p>} />
        </Routes>
        <LocationProbe />
      </>,
      { route: "/dashboard/roadmaps" },
    );

    await user.click(screen.getByRole("link", { name: "Reanudar Backend con Node y NestJS" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps/rm-backend-nest");
    expect(screen.getByText("Detalle")).toBeInTheDocument();
  });
});

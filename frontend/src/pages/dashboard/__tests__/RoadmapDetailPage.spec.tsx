import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoadmapDetailPage } from "@/pages";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapDetailPage", () => {
  it("renderiza una región vacía «Detalle de la ruta» para cualquier id", () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/roadmaps/:roadmapId" element={<RoadmapDetailPage />} />
      </Routes>,
      { route: "/dashboard/roadmaps/rm-frontend-react" },
    );

    const region = screen.getByRole("region", { name: "Detalle de la ruta" });
    expect(region).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});

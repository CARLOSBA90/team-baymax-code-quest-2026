import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapProgressBar } from "@/components/roadmaps";

describe("RoadmapProgressBar", () => {
  it("expone la semántica de progressbar con el nombre de la ruta", () => {
    render(
      <RoadmapProgressBar value={18} status="PAUSED" roadmapName="Backend con Node y NestJS" />,
    );

    const bar = screen.getByRole("progressbar", { name: "Progreso de Backend con Node y NestJS" });
    expect(bar).toHaveAttribute("aria-valuenow", "18");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("18%")).toBeInTheDocument();
    expect(screen.getByTestId("roadmap-progress-fill")).toHaveStyle({ width: "18%" });
    expect(screen.getByTestId("roadmap-progress-fill")).toHaveClass("bg-status-paused");
  });

  it("acota valores fuera de rango a 0–100", () => {
    const { unmount } = render(
      <RoadmapProgressBar value={130} status="COMPLETED" roadmapName="Ruta" />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByTestId("roadmap-progress-fill")).toHaveStyle({ width: "100%" });
    unmount();

    render(<RoadmapProgressBar value={-5} status="NOT_STARTED" roadmapName="Ruta" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("colorea el relleno según el estado", () => {
    render(<RoadmapProgressBar value={42} status="IN_PROGRESS" roadmapName="Ruta" />);

    expect(screen.getByTestId("roadmap-progress-fill")).toHaveClass("bg-status-started-bar");
  });
});

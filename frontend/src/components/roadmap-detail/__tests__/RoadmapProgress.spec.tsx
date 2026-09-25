import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapProgress, type RoadmapProgressProps } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapStatus } from "@/types";

const HEADING_ID = "roadmap-heading";
const ROADMAP_NAME = "Mi ruta de backend";

const BASE_PROPS: Omit<RoadmapProgressProps, "labelledBy"> = {
  progress: 40,
  status: "IN_PROGRESS",
  completed: 2,
  total: 5,
  totalMinutes: 4620,
  remainingMinutes: 3060,
};

function renderProgress(props: Partial<Omit<RoadmapProgressProps, "labelledBy">> = {}) {
  return renderWithProviders(
    <>
      <h1 id={HEADING_ID}>{ROADMAP_NAME}</h1>
      <RoadmapProgress {...BASE_PROPS} {...props} labelledBy={HEADING_ID} />
    </>,
  );
}

function getFill() {
  return screen.getByTestId("roadmap-detail-progress-fill");
}

describe("RoadmapProgress", () => {
  it("es una progressbar nombrada por el h1 con valores y valuetext", () => {
    renderProgress();

    const bar = screen.getByRole("progressbar", { name: ROADMAP_NAME });
    expect(bar).toHaveAttribute("aria-labelledby", HEADING_ID);
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuetext", "40 por ciento. 2 de 5 pasos completados.");
    expect(bar).toHaveClass("h-2", "rounded-full", "bg-progress-track");
  });

  it("muestra el resumen y el porcentaje, con el relleno al ancho del progreso", () => {
    renderProgress();

    expect(screen.getByText("2 de 5 pasos · 77 h en total · quedan ~51 h")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(getFill()).toHaveStyle({ width: "40%" });
  });

  it.each<[RoadmapStatus, string, string]>([
    ["IN_PROGRESS", "bg-status-started-bar", "text-accent-soft"],
    ["NOT_STARTED", "bg-status-started-bar", "text-accent-soft"],
    ["PAUSED", "bg-status-paused-bar", "text-status-paused-text"],
    ["COMPLETED", "bg-status-completed", "text-status-completed-text"],
  ])("%s → relleno %s y porcentaje %s", (status, fillClass, pctClass) => {
    renderProgress({ status });

    expect(getFill()).toHaveClass(fillClass);
    expect(screen.getByText("40%")).toHaveClass(pctClass);
  });

  it("completada: 100% sin «quedan»", () => {
    renderProgress({
      status: "COMPLETED",
      progress: 100,
      completed: 5,
      remainingMinutes: 0,
    });

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("5 de 5 pasos · 77 h en total")).toBeInTheDocument();
    expect(screen.queryByText(/quedan/)).not.toBeInTheDocument();
  });

  it("acota el progreso fuera de rango (100.4 → 100%)", () => {
    renderProgress({ progress: 100.4, completed: 5, remainingMinutes: 0 });

    expect(screen.getByRole("progressbar", { name: ROADMAP_NAME })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(getFill()).toHaveStyle({ width: "100%" });
  });

  it("sin empezar: 0% en violeta", () => {
    renderProgress({ status: "NOT_STARTED", progress: 0, completed: 0 });

    expect(screen.getByText("0%")).toHaveClass("text-accent-soft");
    expect(getFill()).toHaveStyle({ width: "0%" });
  });
});

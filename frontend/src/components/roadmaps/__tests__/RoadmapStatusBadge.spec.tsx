import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapStatusBadge } from "@/components/roadmaps";
import type { RoadmapStatus } from "@/types";

const CASES: [RoadmapStatus, string, string][] = [
  ["IN_PROGRESS", "Empezada", "text-status-started"],
  ["PAUSED", "En pausa", "text-status-paused"],
  ["COMPLETED", "Completada", "text-status-completed"],
  ["NOT_STARTED", "Sin empezar", "text-status-idle"],
];

describe("RoadmapStatusBadge", () => {
  it.each(CASES)("%s muestra '%s' con su color", (status, label, colorClass) => {
    render(<RoadmapStatusBadge status={status} />);

    const badge = screen.getByText(label);
    expect(badge).toHaveClass(colorClass);
  });

  it("el punto de color es decorativo", () => {
    const { container } = render(<RoadmapStatusBadge status="PAUSED" />);

    const dot = container.querySelector("span[aria-hidden='true']");
    expect(dot).toHaveClass("bg-status-paused");
  });
});

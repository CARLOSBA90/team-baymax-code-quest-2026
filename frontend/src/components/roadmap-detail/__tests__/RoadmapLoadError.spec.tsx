import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoadmapLoadError } from "@/components/roadmap-detail";

describe("RoadmapLoadError", () => {
  it("anuncia el error con role=alert y un h1 en español", () => {
    render(<RoadmapLoadError onRetry={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toContainElement(
      screen.getByRole("heading", { level: 1, name: "No pudimos cargar la ruta" }),
    );
  });

  it("«Reintentar» llama a onRetry una vez", async () => {
    const onRetry = vi.fn();
    render(<RoadmapLoadError onRetry={onRetry} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

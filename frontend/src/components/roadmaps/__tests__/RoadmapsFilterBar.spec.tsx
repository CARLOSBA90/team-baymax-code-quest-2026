import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoadmapsFilterBar } from "@/components/roadmaps";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";

describe("RoadmapsFilterBar", () => {
  it("muestra los cuatro filtros en orden con sus counts", () => {
    render(
      <RoadmapsFilterBar active="all" counts={ROADMAPS_LIST_RESULT.counts} onChange={vi.fn()} />,
    );

    const group = screen.getByRole("group", { name: "Filtrar rutas por estado" });
    const names = within(group)
      .getAllByRole("button")
      .map((button) => button.textContent?.replace(/\s+/g, " ").trim());
    expect(names).toEqual(["Todas 5", "Empezadas 2", "En pausa 1", "Completadas 2"]);
    expect(screen.getByRole("button", { name: "Empezadas 2" })).toBeInTheDocument();
  });

  it("marca solo el filtro activo con aria-pressed", () => {
    render(
      <RoadmapsFilterBar
        active="completed"
        counts={ROADMAPS_LIST_RESULT.counts}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Completadas 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const name of ["Todas 5", "Empezadas 2", "En pausa 1"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("llama a onChange con el filtro elegido", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RoadmapsFilterBar active="all" counts={ROADMAPS_LIST_RESULT.counts} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "En pausa 1" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("paused");
  });

  it("permite scroll horizontal en móvil sin scrollbar visible", () => {
    render(
      <RoadmapsFilterBar active="all" counts={ROADMAPS_LIST_RESULT.counts} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("group")).toHaveClass("overflow-x-auto", "-mx-5", "px-5", "md:mx-0");
  });
});

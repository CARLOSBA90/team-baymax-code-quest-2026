import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemStateDot } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapItemState } from "@/types";

const STATE_CASES: [RoadmapItemState, string[]][] = [
  ["pending", ["border-node-pending", "bg-bg-base"]],
  ["next", ["border-node-next", "bg-accent", "shadow-node-next"]],
  ["in_progress", ["border-accent-hover", "bg-bg-base"]],
  ["completed", ["border-node-done", "bg-node-done", "text-node-done-check"]],
];

function renderDot(state: RoadmapItemState, className = "size-3.5") {
  renderWithProviders(<ItemStateDot state={state} testId="state-dot" className={className} />);
  return screen.getByTestId("state-dot");
}

describe("ItemStateDot", () => {
  it.each(STATE_CASES)("%s → clases del estado y forma común", (state, classes) => {
    const dot = renderDot(state);

    expect(dot).toHaveClass(
      ...classes,
      "items-center",
      "justify-center",
      "rounded-full",
      "border-2",
    );
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it("completed → check dentro", () => {
    const dot = renderDot("completed");

    expect(dot.querySelector("svg")).not.toBeNull();
  });

  it("in_progress → punto interior y sin check", () => {
    const dot = renderDot("in_progress");

    expect(dot.querySelector("span")).toHaveClass("size-1.5", "bg-accent-hover");
    expect(dot.querySelector("svg")).toBeNull();
  });

  it.each(["pending", "next"] as const)("%s → vacío por dentro", (state) => {
    const dot = renderDot(state);

    expect(dot).toBeEmptyDOMElement();
  });

  it("aplica las clases del consumidor y no fija display propio", () => {
    const dot = renderDot("next", "absolute top-[22px] size-3.5");

    expect(dot).toHaveClass("absolute", "top-[22px]", "size-3.5");
    expect(dot).not.toHaveClass("flex", "hidden", "inline-flex");
  });

  it("el display lo decide el consumidor", () => {
    const dot = renderDot("pending", "inline-flex size-3.75 sm:hidden");

    expect(dot).toHaveClass("inline-flex", "size-3.75", "sm:hidden");
  });
});

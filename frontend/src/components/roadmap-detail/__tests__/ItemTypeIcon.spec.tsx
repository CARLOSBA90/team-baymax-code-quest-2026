import { describe, expect, it } from "vitest";
import { ItemTypeIcon } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

function renderIconMarkup(type: string) {
  const { container, unmount } = renderWithProviders(
    <ItemTypeIcon type={type} className="size-6" />,
  );
  const svg = container.querySelector("svg");
  const markup = svg?.innerHTML ?? "";
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveClass("size-6");
  unmount();
  return markup;
}

describe("ItemTypeIcon", () => {
  it("pinta un icono decorativo distinto por tipo, también para tipos desconocidos", () => {
    const markups = ["COURSE", "MEDIA", "CHALLENGE", "PODCAST"].map(renderIconMarkup);

    expect(markups.every((markup) => markup !== "")).toBe(true);
    expect(new Set(markups).size).toBe(4);
  });

  it("todos los tipos desconocidos comparten el icono genérico", () => {
    expect(renderIconMarkup("PODCAST")).toBe(renderIconMarkup("QUIZ"));
  });
});

import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemThumbnail } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const SRC = "https://cdn.example.com/courses/js-basics.png";

describe("ItemThumbnail", () => {
  it("con imagen pinta un img decorativo y perezoso sobre el placeholder", () => {
    const { container } = renderWithProviders(<ItemThumbnail src={SRC} type="COURSE" size="md" />);

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", SRC);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("si la imagen falla la retira y queda el placeholder con el icono", () => {
    const { container } = renderWithProviders(<ItemThumbnail src={SRC} type="MEDIA" size="md" />);

    const img = container.querySelector("img");
    if (!img) throw new Error("img esperado");
    fireEvent.error(img);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("sin imagen solo pinta el placeholder", () => {
    const { container } = renderWithProviders(
      <ItemThumbnail src={null} type="CHALLENGE" size="lg" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("usa el gradiente violeta por defecto y el verde con tone done", () => {
    const { container, unmount } = renderWithProviders(
      <ItemThumbnail src={null} type="COURSE" size="md" />,
    );
    expect(container.firstElementChild).toHaveClass("from-thumb-from", "to-thumb-to");
    unmount();

    const done = renderWithProviders(
      <ItemThumbnail src={null} type="COURSE" size="md" tone="done" />,
    );
    expect(done.container.firstElementChild).toHaveClass(
      "from-thumb-done-from",
      "to-thumb-done-to",
    );
  });

  it("aplica el tamaño md (80×56 base) o lg (116×78)", () => {
    const md = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="md" />);
    expect(md.container.firstElementChild).toHaveClass("h-14", "w-20");
    md.unmount();

    const lg = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="lg" />);
    expect(lg.container.firstElementChild).toHaveClass("h-[78px]", "w-[116px]");
  });
});

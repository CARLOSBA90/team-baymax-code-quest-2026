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

  it("aplica el tamaño md (64×44 móvil, 80×56 desde sm:) o lg (64×44 móvil, 116×78 desde sm:)", () => {
    const md = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="md" />);
    expect(md.container.firstElementChild).toHaveClass("sm:h-14", "sm:w-20");
    md.unmount();

    const lg = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="lg" />);
    expect(lg.container.firstElementChild).toHaveClass("sm:h-[78px]", "sm:w-[116px]");
  });

  it("md: clases mobile-first de caja e icono", () => {
    const { container } = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="md" />);

    expect(container.firstElementChild).toHaveClass(
      "h-11",
      "w-16",
      "rounded-[9px]",
      "sm:h-14",
      "sm:w-20",
      "sm:rounded-[10px]",
      "lg:h-16",
      "lg:w-24",
    );
    for (const cls of ["h-14", "w-20"]) expect(container.firstElementChild).not.toHaveClass(cls);
    expect(container.querySelector("svg")).toHaveClass("size-5", "sm:size-6");
  });

  it("lg: clases mobile-first de caja e icono", () => {
    const { container } = renderWithProviders(<ItemThumbnail src={null} type="COURSE" size="lg" />);

    expect(container.firstElementChild).toHaveClass(
      "h-11",
      "w-16",
      "sm:h-[78px]",
      "sm:w-[116px]",
      "sm:rounded-xl",
    );
    for (const cls of ["h-[78px]", "w-[116px]"]) {
      expect(container.firstElementChild).not.toHaveClass(cls);
    }
    expect(container.querySelector("svg")).toHaveClass("size-5", "sm:size-7");
  });

  it.each([SRC, null])("añade className a la raíz (src %s)", (src) => {
    const { container } = renderWithProviders(
      <ItemThumbnail src={src} type="COURSE" size="md" className="[grid-area:thumb] self-start" />,
    );

    expect(container.firstElementChild).toHaveClass("[grid-area:thumb]", "self-start", "h-11");
  });
});

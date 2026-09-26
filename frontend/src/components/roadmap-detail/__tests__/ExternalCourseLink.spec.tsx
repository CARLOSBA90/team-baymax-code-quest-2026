import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalCourseLink } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const URL = "https://example.com/courses/js-basics";
const NAME = "Fundamentos de JavaScript";

describe("ExternalCourseLink", () => {
  it("abre el curso en una pestaña nueva de forma segura", () => {
    renderWithProviders(<ExternalCourseLink url={URL} itemName={NAME} variant="ghost" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("su nombre empieza por el texto visible e incluye el ítem y el aviso de pestaña nueva", () => {
    const { container } = renderWithProviders(
      <ExternalCourseLink url={URL} itemName={NAME} variant="ghost" />,
    );

    const link = screen.getByRole("link", {
      name: `Ir al curso ${NAME} (se abre en una pestaña nueva)`,
    });
    expect(link).toHaveAccessibleName(/^Ir al curso/);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("dos ítems tienen nombres distintos", () => {
    renderWithProviders(
      <>
        <ExternalCourseLink url={URL} itemName="A" variant="ghost" />
        <ExternalCourseLink url={URL} itemName="B" variant="ghost" />
      </>,
    );

    const names = screen.getAllByRole("link").map((link) => link.textContent);
    expect(new Set(names).size).toBe(2);
  });

  it.each([
    ["primary", ["bg-accent", "h-12", "w-full", "px-5", "sm:h-11", "sm:w-fit"], ["h-11", "h-10"]],
    [
      "ghost",
      ["bg-bg-ghost", "border-border-ghost", "h-11", "w-full", "px-4", "sm:h-10", "sm:w-fit"],
      ["h-10", "h-12"],
    ],
    [
      "next",
      ["bg-accent/15", "border-border-item-next", "h-11", "w-full", "px-4", "sm:h-10", "sm:w-fit"],
      ["h-10", "h-12"],
    ],
  ] as const)(
    "variante %s: mobile-first (alto y ancho base de móvil, sm: de tablet)",
    (variant, classes, absent) => {
      renderWithProviders(<ExternalCourseLink url={URL} itemName={NAME} variant={variant} />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass(...classes);
      for (const cls of ["w-fit", ...absent]) expect(link).not.toHaveClass(cls);
    },
  );
});

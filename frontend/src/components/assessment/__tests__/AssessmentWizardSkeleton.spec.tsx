import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssessmentWizardSkeleton } from "@/components/assessment";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("AssessmentWizardSkeleton", () => {
  it("expone un status accesible ocupado con el texto de carga", () => {
    renderWithProviders(<AssessmentWizardSkeleton />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Cargando preguntas…");
  });

  it("no renderiza opciones ni botones", () => {
    renderWithProviders(<AssessmentWizardSkeleton />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("oculta los bloques visuales a las tecnologías de asistencia", () => {
    renderWithProviders(<AssessmentWizardSkeleton />);

    const blocks = screen.getByTestId("assessment-skeleton-blocks");
    expect(blocks).toHaveAttribute("aria-hidden", "true");
    expect(blocks).toHaveClass("animate-pulse", "motion-reduce:animate-none");
  });
});

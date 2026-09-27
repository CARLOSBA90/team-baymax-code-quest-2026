import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LessonRow, type LessonRowProps } from "@/components/roadmap-detail";
import { buildSyllabusLesson } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

function renderRow(props: Partial<LessonRowProps> = {}) {
  return renderWithProviders(
    <ul>
      <LessonRow
        lesson={buildSyllabusLesson()}
        itemName="Fundamentos de JavaScript"
        checked={false}
        disabled={false}
        busy={false}
        onToggle={vi.fn()}
        {...props}
      />
    </ul>,
  );
}

describe("LessonRow", () => {
  it("checkbox con el título de la lección y el ítem como contexto accesible", () => {
    renderRow();

    const checkbox = screen.getByRole("checkbox", {
      name: "Variables y tipos de datos, Fundamentos de JavaScript",
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("Variables y tipos de datos")).toBeInTheDocument();
  });

  it("checked refleja lesson.completed", () => {
    renderRow({ checked: true });

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("clic llama a onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderRow({ onToggle });

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("busy: aria-busy sin disabled nativo y onChange no-op", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderRow({ busy: true, disabled: false, onToggle });

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-busy", "true");
    expect(checkbox).not.toBeDisabled();

    await user.click(checkbox);

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("disabled (sin busy): disabled nativo", () => {
    renderRow({ disabled: true, busy: false });

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toHaveAttribute("aria-busy");
  });
});

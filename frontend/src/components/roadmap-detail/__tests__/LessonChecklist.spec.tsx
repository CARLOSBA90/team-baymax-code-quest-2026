import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LessonChecklist, type LessonChecklistProps } from "@/components/roadmap-detail";
import { buildSyllabus } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const ITEM = {
  roadmapItemId: "item-1",
  name: "Fundamentos de JavaScript",
  syllabus: buildSyllabus(),
};

function renderChecklist(props: Partial<LessonChecklistProps> = {}) {
  return renderWithProviders(
    <LessonChecklist
      item={ITEM}
      headingId="tl-step-item-1"
      locked={false}
      pendingKey={null}
      onToggle={vi.fn()}
      {...props}
    />,
  );
}

describe("LessonChecklist", () => {
  it("colapsado por defecto: aria-expanded=false y el <ul> con hidden", () => {
    const { container } = renderChecklist();

    const button = screen.getByRole("button", { name: /Temario/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    const controlsId = button.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    const list = container.querySelector(`#${controlsId}`) as HTMLElement;
    expect(list).not.toBeVisible();
    expect(list.tagName).toBe("UL");
  });

  it("muestra el progreso en el nombre del botón", () => {
    renderChecklist({ item: { ...ITEM, syllabus: buildSyllabus({ completedLessons: 1 }) } });

    expect(screen.getByRole("button", { name: /1 de 4 lecciones/ })).toBeInTheDocument();
  });

  it("expandir: aria-expanded=true y las secciones/lecciones visibles", async () => {
    const user = userEvent.setup();
    renderChecklist();

    await user.click(screen.getByRole("button", { name: /Temario/ }));

    const button = screen.getByRole("button", { name: /Temario/ });
    expect(button).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list", { name: /Temario/ });
    expect(list).toBeVisible();
    expect(screen.getByText("Fundamentos")).toBeInTheDocument();
    expect(screen.getByText("Funciones y control de flujo")).toBeInTheDocument();
    expect(within(list).getAllByRole("checkbox")).toHaveLength(4);
  });

  it("permanece abierto tras un re-render con un syllabus nuevo (mismo componente)", async () => {
    // Wrapper con estado propio: cambia las props del MISMO `LessonChecklist` montado (a
    // diferencia de `rerender`, que pierde los providers y remonta el árbol; ver CLAUDE.md).
    function Wrapper() {
      const [completedLessons, setCompletedLessons] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCompletedLessons(2)}>
            Simular refetch
          </button>
          <LessonChecklist
            item={{ ...ITEM, syllabus: buildSyllabus({ completedLessons }) }}
            headingId="tl-step-item-1"
            locked={false}
            pendingKey={null}
            onToggle={vi.fn()}
          />
        </>
      );
    }

    const user = userEvent.setup();
    renderWithProviders(<Wrapper />);

    await user.click(screen.getByRole("button", { name: /Temario/ }));
    expect(screen.getByRole("button", { name: /Temario/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Simular refetch" }));

    expect(screen.getByRole("button", { name: /Temario/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /2 de 4 lecciones/ })).toBeInTheDocument();
  });

  it("clic en un checkbox llama a onToggle con el lessonId y el completed objetivo", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderChecklist({ onToggle });

    await user.click(screen.getByRole("button", { name: /Temario/ }));
    await user.click(screen.getByRole("checkbox", { name: /Variables y tipos de datos/ }));

    expect(onToggle).toHaveBeenCalledWith("lesson-1", true);
  });

  it("locked bloquea todos los checkboxes salvo el de pendingKey", async () => {
    const user = userEvent.setup();
    renderChecklist({ locked: true, pendingKey: "item-1:lesson-2" });

    await user.click(screen.getByRole("button", { name: /Temario/ }));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).not.toBeDisabled();
    expect(checkboxes[1]).toHaveAttribute("aria-busy", "true");
  });
});

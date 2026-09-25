import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssessmentOptionCard } from "@/components/assessment";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { AssessmentOption } from "@/types";

const option: AssessmentOption = {
  id: "q1-o2",
  text: "Diseñar servidores, APIs robustas y arquitecturas escalables",
  order: 2,
};

describe("AssessmentOptionCard", () => {
  it("expone un radio con nombre igual al texto de la opción", () => {
    renderWithProviders(
      <AssessmentOptionCard
        name="question-q1"
        option={option}
        checked={false}
        onSelect={vi.fn()}
      />,
    );

    const radio = screen.getByRole("radio", { name: option.text });
    expect(radio).toHaveAttribute("name", "question-q1");
    expect(radio).toHaveAttribute("value", option.id);
  });

  it("refleja checked=false", () => {
    renderWithProviders(
      <AssessmentOptionCard
        name="question-q1"
        option={option}
        checked={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("radio", { name: option.text })).not.toBeChecked();
  });

  it("refleja checked=true", () => {
    renderWithProviders(
      <AssessmentOptionCard name="question-q1" option={option} checked onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("radio", { name: option.text })).toBeChecked();
  });

  it("un clic en el texto llama a onSelect con el id de la opción", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <AssessmentOptionCard
        name="question-q1"
        option={option}
        checked={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText(option.text));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(option.id);
  });

  it("muestra solo el texto de la opción, sin descripción ni valor", () => {
    renderWithProviders(
      <AssessmentOptionCard
        name="question-q1"
        option={option}
        checked={false}
        onSelect={vi.fn()}
      />,
    );

    const card = screen.getByRole("radio", { name: option.text }).closest("label");
    expect(card).toHaveTextContent(option.text, { normalizeWhitespace: true });
    expect(card?.textContent?.trim()).toBe(option.text);
    expect(card?.textContent).not.toMatch(/\d/);
  });
});

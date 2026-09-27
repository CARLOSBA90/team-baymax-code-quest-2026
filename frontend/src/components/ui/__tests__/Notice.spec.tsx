import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Notice, type NoticeVariant } from "@/components/ui";

const TOKEN_CLASSES: Record<NoticeVariant, string[]> = {
  error: ["bg-notice-error-bg", "border-notice-error-border", "text-notice-error-text"],
  success: ["bg-notice-success-bg", "border-notice-success-border", "text-notice-success-text"],
  info: ["bg-notice-info-bg", "border-notice-info-border", "text-notice-info-text"],
};

const VARIANTS: NoticeVariant[] = ["error", "success", "info"];

describe("Notice", () => {
  it("error se anuncia como única alerta", () => {
    render(<Notice variant="error">Fallo</Notice>);

    expect(screen.getByRole("alert")).toHaveTextContent("Fallo");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("success es un status", () => {
    render(<Notice variant="success">Hecho</Notice>);

    expect(screen.getByRole("status")).toHaveTextContent("Hecho");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("info es un único status, sin alerta", () => {
    render(<Notice variant="info">Ya tienes la versión más reciente.</Notice>);

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Ya tienes la versión más reciente.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(VARIANTS)("%s usa sus tokens --color-notice-* y ningún estilo inline", (variant) => {
    render(<Notice variant={variant}>Texto</Notice>);
    const notice = screen.getByText("Texto");

    for (const className of TOKEN_CLASSES[variant]) {
      expect(notice).toHaveClass(className);
    }
    for (const other of VARIANTS.filter((v) => v !== variant)) {
      for (const className of TOKEN_CLASSES[other]) {
        expect(notice).not.toHaveClass(className);
      }
    }
    expect(notice).toHaveClass("border");
    expect(notice).not.toHaveAttribute("style");
  });
});

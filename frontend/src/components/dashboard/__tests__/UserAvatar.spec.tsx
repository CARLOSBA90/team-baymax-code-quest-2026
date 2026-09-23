import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserAvatar } from "@/components/dashboard";

describe("UserAvatar", () => {
  it("muestra las iniciales del nombre", () => {
    render(<UserAvatar name="Laura Gómez" email="laura@example.com" />);
    expect(screen.getByText("LG")).toBeInTheDocument();
  });

  it("usa la inicial del email si no hay nombre", () => {
    render(<UserAvatar name="" email="zed@example.com" />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });

  it('muestra "?" sin nombre ni email', () => {
    render(<UserAvatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("es decorativo y admite clases extra", () => {
    render(<UserAvatar name="Ada Lovelace" className="size-8" />);
    const avatar = screen.getByText("AL");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar).toHaveClass("rounded-full", "size-8");
  });
});

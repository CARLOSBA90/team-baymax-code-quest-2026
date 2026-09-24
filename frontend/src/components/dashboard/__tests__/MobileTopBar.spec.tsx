import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { MobileTopBar } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));

describe("MobileTopBar", () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: "Ada Lovelace", email: "ada@example.com" } },
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it("es un banner solo visible en móvil con margen de safe-area superior", () => {
    renderWithProviders(<MobileTopBar />, { route: "/dashboard/roadmaps" });
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("md:hidden", "pt-[max(1rem,env(safe-area-inset-top))]");
  });

  it("incluye el enlace de marca a /dashboard/roadmaps y el menú de usuario", () => {
    renderWithProviders(<MobileTopBar />, { route: "/dashboard/roadmaps" });
    const header = screen.getByRole("banner");
    const brand = within(header).getByRole("link");
    expect(brand).toHaveTextContent("devtalles");
    expect(brand).toHaveAttribute("href", "/dashboard/roadmaps");
    expect(
      within(header).getByRole("button", { name: "Menú de usuario de Ada Lovelace" }),
    ).toBeInTheDocument();
  });

  it("no usa overflow-hidden (no recorta el menú del avatar)", () => {
    renderWithProviders(<MobileTopBar />, { route: "/dashboard/roadmaps" });
    expect(screen.getByRole("banner")).not.toHaveClass("overflow-hidden");
  });
});

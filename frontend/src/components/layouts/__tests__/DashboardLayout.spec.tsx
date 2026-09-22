import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { DashboardLayout } from "@/components/layouts";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));

function renderLayout() {
  return renderWithProviders(
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard/roadmaps" element={<p>child-content</p>} />
      </Route>
    </Routes>,
    { route: "/dashboard/roadmaps" },
  );
}

describe("DashboardLayout", () => {
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

  it("renderiza el sidebar y un único main con el contenido del Outlet", () => {
    renderLayout();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveTextContent("child-content");
  });

  it("tiene un único landmark de navegación", () => {
    renderLayout();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("aplica las clases de layout y degradación", () => {
    renderLayout();
    expect(screen.getByRole("complementary")).toHaveClass("w-64", "shrink-0");
    const main = screen.getByRole("main");
    expect(main).toHaveClass("min-w-0", "flex-1", "overflow-auto");
    expect(main.parentElement).toHaveClass("h-dvh", "overflow-hidden");
  });

  it("no usa .nebula en el main", () => {
    renderLayout();
    const main = screen.getByRole("main");
    expect(main).not.toHaveClass("nebula");
    expect(main.querySelector(".nebula")).toBeNull();
  });
});

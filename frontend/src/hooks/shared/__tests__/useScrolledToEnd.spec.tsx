import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useScrolledToEnd } from "@/hooks";
import { renderWithProviders } from "@/test/renderWithProviders";

function Probe() {
  const { ref, hasReachedEnd, onScroll } = useScrolledToEnd<HTMLDivElement>();
  return (
    <>
      <div data-testid="scroller" ref={ref} onScroll={onScroll} />
      <span>{hasReachedEnd ? "final" : "pendiente"}</span>
    </>
  );
}

function mockOverflow(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
  return vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
}

function scrollTo(scrollTop: number) {
  const scroller = screen.getByTestId("scroller");
  scroller.scrollTop = scrollTop;
  fireEvent.scroll(scroller);
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  readonly callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
}

describe("useScrolledToEnd", () => {
  it("contenido sin overflow: true al montar", () => {
    mockOverflow(300, 300);
    renderWithProviders(<Probe />);

    expect(screen.getByText("final")).toBeInTheDocument();
  });

  it("sin layout al montar (clientHeight 0) no decide: sigue en false", () => {
    mockOverflow(0, 0);
    renderWithProviders(<Probe />);

    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("sin layout al montar, re-evalúa cuando el ResizeObserver avisa de que ya tiene tamaño", () => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const clientHeight = mockOverflow(1000, 0);
    renderWithProviders(<Probe />);
    const [observer] = FakeResizeObserver.instances;

    clientHeight.mockReturnValue(300);
    act(() => observer?.callback());
    expect(screen.getByText("pendiente")).toBeInTheDocument();

    clientHeight.mockReturnValue(1000);
    act(() => observer?.callback());
    expect(screen.getByText("final")).toBeInTheDocument();
  });

  it("con overflow empieza en false", () => {
    mockOverflow(1000, 300);
    renderWithProviders(<Probe />);

    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("scroll parcial fuera del umbral sigue en false", () => {
    mockOverflow(1000, 300);
    renderWithProviders(<Probe />);

    scrollTo(691);

    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("scroll hasta el final (justo en el umbral de 8 px) pasa a true", () => {
    mockOverflow(1000, 300);
    renderWithProviders(<Probe />);

    scrollTo(692);

    expect(screen.getByText("final")).toBeInTheDocument();
  });

  it("latch: volver a subir no lo devuelve a false", () => {
    mockOverflow(1000, 300);
    renderWithProviders(<Probe />);

    scrollTo(700);
    scrollTo(0);

    expect(screen.getByText("final")).toBeInTheDocument();
  });

  it("ResizeObserver: observa el elemento, re-evalúa al redimensionar y desconecta al desmontar", () => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const clientHeight = mockOverflow(1000, 300);
    const { unmount } = renderWithProviders(<Probe />);

    const [observer] = FakeResizeObserver.instances;
    expect(observer?.observe).toHaveBeenCalledWith(screen.getByTestId("scroller"));
    expect(screen.getByText("pendiente")).toBeInTheDocument();

    clientHeight.mockReturnValue(1000);
    act(() => observer?.callback());
    expect(screen.getByText("final")).toBeInTheDocument();

    unmount();
    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("sin ResizeObserver no lanza", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    mockOverflow(1000, 300);

    expect(() => renderWithProviders(<Probe />)).not.toThrow();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });
});

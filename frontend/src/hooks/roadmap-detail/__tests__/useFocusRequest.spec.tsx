import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOCUS_REQUEST_MAX_WAIT_MS, useFocusRequest } from "@/hooks";

interface Snapshot {
  version: number;
}

const INITIAL: Snapshot = { version: 1 };
const NEXT: Snapshot = { version: 2 };

interface HarnessProps {
  maxWaitMs?: number;
}

/** Componente con estado: cambia `current` sin `rerender` (que pierde los providers). */
function Harness({ maxWaitMs }: HarnessProps) {
  const [current, setCurrent] = useState<Snapshot>(INITIAL);
  const { requestFocus, cancelFocus } = useFocusRequest(
    current,
    "fallback",
    maxWaitMs === undefined ? undefined : { maxWaitMs },
  );
  return (
    <>
      <h1 id="fallback" tabIndex={-1}>
        Fallback
      </h1>
      <h2 id="present" tabIndex={-1}>
        Presente
      </h2>
      {current === NEXT ? (
        <h2 id="painted" tabIndex={-1}>
          Pintado
        </h2>
      ) : null}
      <button type="button" onClick={() => requestFocus("present", undefined)}>
        Sin caché
      </button>
      <button type="button" onClick={() => requestFocus("present", current)}>
        Misma referencia
      </button>
      <button type="button" onClick={() => requestFocus("painted", NEXT)}>
        Esperar al pintado
      </button>
      <button type="button" onClick={() => requestFocus("present", NEXT)}>
        Esperar al presente
      </button>
      <button type="button" onClick={() => requestFocus("missing", undefined)}>
        Inexistente
      </button>
      <button type="button" onClick={() => setCurrent(NEXT)}>
        Actualizar
      </button>
      <button type="button" onClick={cancelFocus}>
        Cancelar
      </button>
    </>
  );
}

const heading = (name: string) => screen.getByRole("heading", { name });
const button = (name: string) => screen.getByRole("button", { name });

describe("useFocusRequest", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin valor en caché enfoca el destino en el mismo commit", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(button("Sin caché"));

    expect(document.activeElement).toBe(heading("Presente"));
  });

  it("con la misma referencia que el valor pintado (respuesta idempotente) no espera", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(button("Misma referencia"));

    expect(document.activeElement).toBe(heading("Presente"));
  });

  it("con un valor distinto en caché espera a que se pinte y entonces enfoca el destino", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(button("Esperar al pintado"));
    expect(document.activeElement).toBe(button("Esperar al pintado"));

    await user.click(button("Actualizar"));

    expect(document.activeElement).toBe(heading("Pintado"));
  });

  it("si el destino no existe cae en el fallback", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(button("Inexistente"));

    expect(document.activeElement).toBe(heading("Fallback"));
  });

  it("cancelFocus anula una petición en espera", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(button("Esperar al pintado"));
    await user.click(button("Cancelar"));
    await user.click(button("Actualizar"));

    expect(document.activeElement).toBe(button("Actualizar"));
  });

  describe("cota maxWaitMs", () => {
    function useFakeTimersForTestingLibrary() {
      vi.useFakeTimers();
      vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
    }

    it("por defecto espera 1000 ms", () => {
      expect(FOCUS_REQUEST_MAX_WAIT_MS).toBe(1000);
    });

    it("si el valor nunca cambia, enfoca el destino al agotar la espera", () => {
      useFakeTimersForTestingLibrary();
      render(<Harness maxWaitMs={500} />);

      fireEvent.click(button("Esperar al presente"));
      act(() => vi.advanceTimersByTime(499));
      expect(document.activeElement).toBe(document.body);

      act(() => vi.advanceTimersByTime(1));
      expect(document.activeElement).toBe(heading("Presente"));
    });

    it("sin el destino pintado, al agotar la espera cae en el fallback", () => {
      useFakeTimersForTestingLibrary();
      render(<Harness />);

      fireEvent.click(button("Esperar al pintado"));
      act(() => vi.advanceTimersByTime(FOCUS_REQUEST_MAX_WAIT_MS));

      expect(document.activeElement).toBe(heading("Fallback"));
    });

    it("si el valor llega antes, enfoca entonces y limpia el timeout (sin doble foco)", () => {
      useFakeTimersForTestingLibrary();
      render(<Harness maxWaitMs={500} />);

      fireEvent.click(button("Esperar al pintado"));
      act(() => vi.advanceTimersByTime(200));
      fireEvent.click(button("Actualizar"));
      expect(document.activeElement).toBe(heading("Pintado"));

      // El usuario sigue navegando: la cota ya no debe mover el foco.
      act(() => button("Cancelar").focus());
      act(() => vi.advanceTimersByTime(1000));
      expect(document.activeElement).toBe(button("Cancelar"));
    });

    it("cancelFocus también cancela la cota", () => {
      useFakeTimersForTestingLibrary();
      render(<Harness maxWaitMs={500} />);

      fireEvent.click(button("Esperar al presente"));
      fireEvent.click(button("Cancelar"));
      act(() => vi.advanceTimersByTime(1000));

      expect(document.activeElement).toBe(document.body);
    });
  });
});

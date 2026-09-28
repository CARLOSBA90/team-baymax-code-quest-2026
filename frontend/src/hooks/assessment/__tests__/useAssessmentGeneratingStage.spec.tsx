import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAssessmentGeneratingStage } from "@/hooks";
import { ASSESSMENT_GENERATING_STAGES } from "@/lib";

const [SAVING, ANALYZING, BUILDING] = ASSESSMENT_GENERATING_STAGES;

function renderStage(active: boolean) {
  return renderHook(({ active: isActive }) => useAssessmentGeneratingStage(isActive), {
    initialProps: { active },
  });
}

describe("useAssessmentGeneratingStage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin espera en curso no hay etapa, ni anuncio, ni temporizadores", () => {
    vi.useFakeTimers();
    const { result } = renderStage(false);

    expect(result.current.stage).toBeNull();
    expect(result.current.announcement).toBe("");
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.stage).toBeNull();
    expect(result.current.announcement).toBe("");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("con espera en curso arranca en la primera etapa y la anuncia", () => {
    vi.useFakeTimers();
    const { result } = renderStage(true);

    expect(result.current.stage).toEqual(SAVING);
    expect(result.current.announcement).toBe(SAVING.announcement);
  });

  it("a los 7 s pasa a la segunda etapa sin cambiar el anuncio", () => {
    vi.useFakeTimers();
    const { result } = renderStage(true);

    act(() => {
      vi.advanceTimersByTime(6_999);
    });
    expect(result.current.stage).toEqual(SAVING);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.stage).toEqual(ANALYZING);
    expect(result.current.announcement).toBe(SAVING.announcement);
  });

  it("a los 18 s pasa a la tercera etapa y ahí aguanta", () => {
    vi.useFakeTimers();
    const { result } = renderStage(true);

    act(() => {
      vi.advanceTimersByTime(18_000);
    });
    expect(result.current.stage).toEqual(BUILDING);
    expect(result.current.announcement).toBe(BUILDING.announcement);

    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(result.current.stage).toEqual(BUILDING);
    expect(result.current.announcement).toBe(BUILDING.announcement);
  });

  it("desactivar a mitad limpia etapa, anuncio y temporizadores", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderStage(true);

    act(() => {
      vi.advanceTimersByTime(7_000);
    });
    expect(result.current.stage).toEqual(ANALYZING);

    rerender({ active: false });

    expect(result.current.stage).toBeNull();
    expect(result.current.announcement).toBe("");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reactivar vuelve a narrar desde la primera etapa", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderStage(true);

    act(() => {
      vi.advanceTimersByTime(18_000);
    });
    expect(result.current.stage).toEqual(BUILDING);

    rerender({ active: false });
    rerender({ active: true });

    expect(result.current.stage).toEqual(SAVING);
    expect(result.current.announcement).toBe(SAVING.announcement);
  });

  it("al desmontar con la espera activa no quedan temporizadores huérfanos", () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderStage(true);

    unmount();

    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });
});

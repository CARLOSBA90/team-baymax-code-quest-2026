import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { get, post } from "@/api/client";
import {
  ASSESSMENT_QUESTIONS_STALE_TIME,
  assessmentsKeys,
  useAssessmentQuestions,
  useSubmitAssessment,
} from "@/api/queries/assessments";
import { getAssessmentQuestions, submitAssessment } from "@/api/services";
import { buildAxiosError } from "@/test/fixtures/api-errors";
import { ASSESSMENT_QUESTIONS_MOCK, buildAssessmentResultMock } from "@/test/fixtures/assessments";

vi.mock("@/api/client", () => ({ get: vi.fn(), post: vi.fn() }));

const INPUT = {
  answers: ASSESSMENT_QUESTIONS_MOCK.map((question) => ({
    questionId: question.id,
    optionId: question.options[0].id,
  })),
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

function createSharedWrapper(queryClient: QueryClient) {
  return function SharedWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("assessments.service", () => {
  it("getAssessmentQuestions pide GET /assessments/questions y devuelve los datos", async () => {
    vi.mocked(get).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);

    await expect(getAssessmentQuestions()).resolves.toEqual(ASSESSMENT_QUESTIONS_MOCK);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/assessments/questions");
  });

  it("submitAssessment envía { answers } tal cual por POST /assessments/submit", async () => {
    const result = buildAssessmentResultMock(INPUT);
    vi.mocked(post).mockResolvedValue(result);

    await expect(submitAssessment(INPUT)).resolves.toEqual(result);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/assessments/submit", INPUT);
  });

  it("submitAssessment propaga el mismo error cuando post rechaza", async () => {
    const error = buildAxiosError(400, "Respuestas inválidas");
    vi.mocked(post).mockRejectedValue(error);

    await expect(submitAssessment(INPUT)).rejects.toBe(error);
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("useAssessmentQuestions", () => {
  it("empieza pendiente sin datos y pasa a éxito con las preguntas", async () => {
    vi.mocked(get).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);

    const { result } = renderHook(() => useAssessmentQuestions(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ASSESSMENT_QUESTIONS_MOCK);
  });

  it("propaga el mismo error cuando la petición falla", async () => {
    const error = buildAxiosError(500, "Error interno");
    vi.mocked(get).mockRejectedValue(error);

    const { result } = renderHook(() => useAssessmentQuestions(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("reutiliza la caché sin volver a pedir las preguntas mientras siguen frescas", async () => {
    vi.mocked(get).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);
    const sharedWrapper = createSharedWrapper(createQueryClient());

    const first = renderHook(() => useAssessmentQuestions(), { wrapper: sharedWrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const { result } = renderHook(() => useAssessmentQuestions(), { wrapper: sharedWrapper });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(ASSESSMENT_QUESTIONS_MOCK);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("vuelve a pedir las preguntas cuando la caché supera el staleTime", async () => {
    vi.mocked(get).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);
    const queryClient = createQueryClient();
    queryClient.setQueryData(assessmentsKeys.questions(), ASSESSMENT_QUESTIONS_MOCK, {
      updatedAt: Date.now() - ASSESSMENT_QUESTIONS_STALE_TIME - 1,
    });

    const { result } = renderHook(() => useAssessmentQuestions(), {
      wrapper: createSharedWrapper(queryClient),
    });

    expect(result.current.data).toEqual(ASSESSMENT_QUESTIONS_MOCK);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  });
});

describe("useSubmitAssessment", () => {
  it("delega en post y resuelve el AssessmentResult", async () => {
    const assessmentResult = buildAssessmentResultMock(INPUT);
    vi.mocked(post).mockResolvedValue(assessmentResult);

    const { result } = renderHook(() => useSubmitAssessment(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(INPUT)).resolves.toEqual(assessmentResult);
    });
    expect(post).toHaveBeenCalledWith("/assessments/submit", INPUT);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(assessmentResult);
  });

  it("propaga el mismo error cuando post rechaza", async () => {
    const error = buildAxiosError(400, "Respuestas inválidas");
    vi.mocked(post).mockRejectedValue(error);

    const { result } = renderHook(() => useSubmitAssessment(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(INPUT)).rejects.toBe(error);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});

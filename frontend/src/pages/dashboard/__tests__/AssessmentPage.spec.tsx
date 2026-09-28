import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ASSESSMENT_QUESTIONS_STALE_TIME, assessmentsKeys } from "@/api/queries/assessments";
import { getAssessmentQuestions, getRoadmaps, submitAssessment } from "@/api/services";
import { MAX_GENERATING_REOPENS } from "@/components/assessment";
import {
  ASSESSMENT_GENERATING_STAGES,
  ASSESSMENT_GENERATING_TITLE,
  ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE,
} from "@/lib";
import { AssessmentPage, RoadmapsPage } from "@/pages";
import { buildAxiosError, buildNetworkError, buildTimeoutError } from "@/test/fixtures/api-errors";
import {
  ASSESSMENT_QUESTIONS_MOCK,
  buildAssessmentResultFailedMock,
  buildAssessmentResultMock,
  MOCK_GENERATED_ROADMAP_ID,
} from "@/test/fixtures/assessments";
import { EMPTY_ROADMAPS_RESULT } from "@/test/fixtures/roadmaps";
import { createTestQueryClient, renderWithProviders } from "@/test/renderWithProviders";
import type { AssessmentResult } from "@/types";

vi.mock("@/api/services", () => ({
  deleteRoadmap: vi.fn(),
  getAssessmentQuestions: vi.fn(),
  getRoadmaps: vi.fn(),
  submitAssessment: vi.fn(),
}));

const FIRST = ASSESSMENT_QUESTIONS_MOCK[0];
const SECOND = ASSESSMENT_QUESTIONS_MOCK[1];
const THIRD = ASSESSMENT_QUESTIONS_MOCK[2];
const LAST = ASSESSMENT_QUESTIONS_MOCK[ASSESSMENT_QUESTIONS_MOCK.length - 1];

const NEUTRAL_SUBTITLE =
  "Unas preguntas rápidas. Con tus respuestas elegimos los cursos de DevTalles y el orden en que te conviene tomarlos.";
const EMPTY_MESSAGE = "Todavía no hay preguntas disponibles. Vuelve a intentarlo más tarde.";
const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const FAILED_NOTICE =
  "Guardamos tus respuestas del cuestionario, pero no pudimos generar tu ruta. Vuelve a intentarlo en unos minutos.";
const DETAIL_PATH = `/dashboard/roadmaps/${MOCK_GENERATED_ROADMAP_ID}`;
const DETAIL_STUB = "Detalle de la ruta";
const SUBMIT_NAME = "Descubrir mi ruta de aprendizaje";

const [SAVING_STAGE, ANALYZING_STAGE, BUILDING_STAGE] = ASSESSMENT_GENERATING_STAGES;
// `announcement` es `string | null` en el tipo; que estas dos no sean nulas lo fija el spec de
// `assessment-labels`.
const SAVING_ANNOUNCEMENT = SAVING_STAGE.announcement ?? "";
const BUILDING_ANNOUNCEMENT = BUILDING_STAGE.announcement ?? "";
const SCROLL_LOCK = "overflow-hidden";
const BACKEND_400_MESSAGE = "Faltan respuestas del cuestionario";

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      Atrás
    </button>
  );
}

type RenderOptions = Parameters<typeof renderWithProviders>[1];

function renderPage(options: RenderOptions = { route: "/dashboard/roadmaps/new" }) {
  const utils = renderWithProviders(
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<RoadmapsPage />} />
        <Route path="/dashboard/roadmaps/new" element={<AssessmentPage />} />
        {/* Stub: el detalle real tiene su propio spec; aquí solo importa llegar a la URL. */}
        <Route path="/dashboard/roadmaps/:id" element={<p>{DETAIL_STUB}</p>} />
      </Routes>
      <LocationProbe />
      <BackButton />
    </>,
    options,
  );
  return { ...utils, user: userEvent.setup() };
}

function location() {
  return screen.getByTestId("location").textContent;
}

function subtitle() {
  return screen.getByRole("heading", { level: 1, name: "Descubre tu ruta" }).nextElementSibling;
}

type User = ReturnType<typeof userEvent.setup>;

/** Responde la pregunta visible con su primera opción y, si no es la última, avanza. */
async function answerCurrent(user: User, advance: boolean) {
  await user.click(screen.getAllByRole("radio")[0]);
  if (advance) await user.click(screen.getByRole("button", { name: "Siguiente" }));
}

async function answerAll(user: User) {
  for (let index = 0; index < ASSESSMENT_QUESTIONS_MOCK.length; index++) {
    await answerCurrent(user, index < ASSESSMENT_QUESTIONS_MOCK.length - 1);
  }
}

/** Promesa que el test resuelve o rechaza cuando quiere. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function expectExitNavigates(user: User) {
  await user.click(screen.getByRole("button", { name: "Salir" }));
  expect(location()).toBe("/dashboard/roadmaps");
}

/** Texto visible de la etapa dentro del diálogo de espera. */
function stageText() {
  return screen.getByTestId("assessment-generating-stage").textContent;
}

/** La live region de la espera no tiene `role`: se busca por `data-testid`, nunca por rol. */
function announcer() {
  return screen.getByTestId("assessment-generating-announcer");
}

function generatingDialog() {
  return screen.getByRole("dialog", { name: ASSESSMENT_GENERATING_TITLE });
}

/** Cierre del `<dialog>` por el navegador (CloseWatcher, gesto atrás de Android). */
function closeDialogNatively() {
  const dialog = screen.getByRole("dialog") as HTMLDialogElement;
  act(() => {
    dialog.close();
  });
}

describe("AssessmentPage", () => {
  beforeEach(() => {
    vi.mocked(getAssessmentQuestions).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);
    // Al navegar a Mis Rutas se monta `RoadmapsPage`, que pide la lista.
    vi.mocked(getRoadmaps).mockResolvedValue(EMPTY_ROADMAPS_RESULT);
    vi.mocked(submitAssessment).mockImplementation((input) =>
      Promise.resolve(buildAssessmentResultMock(input)),
    );
  });

  describe("encabezado", () => {
    it("muestra el breadcrumb con nombre accesible propio", async () => {
      renderPage();

      const breadcrumb = screen.getByRole("navigation", { name: "Ruta de navegación" });
      expect(within(breadcrumb).getByRole("link", { name: "Mis Rutas" })).toHaveAttribute(
        "href",
        "/dashboard/roadmaps",
      );
      const current = within(breadcrumb).getByText("Nueva ruta");
      expect(current).toHaveAttribute("aria-current", "page");
      expect(
        within(breadcrumb).queryByRole("link", { name: "Nueva ruta" }),
      ).not.toBeInTheDocument();
      expect(current.closest("a")).toBeNull();
      await screen.findByRole("group", { name: FIRST.text });
    });

    it("el enlace Mis Rutas del breadcrumb navega a /dashboard/roadmaps", async () => {
      const { user } = renderPage();

      await user.click(screen.getByRole("link", { name: "Mis Rutas" }));

      expect(location()).toBe("/dashboard/roadmaps");
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
    });

    it("muestra el h1 y el subtítulo derivado de las 7 preguntas", async () => {
      renderPage();

      expect(
        screen.getByRole("heading", { level: 1, name: "Descubre tu ruta" }),
      ).toBeInTheDocument();
      expect(await screen.findByText(/^Siete preguntas rápidas/)).toBeInTheDocument();
      expect(screen.queryByText(/Cinco/)).not.toBeInTheDocument();
      expect(screen.getByText("Pregunta 1 de 7")).toBeInTheDocument();
    });

    it("el botón Salir tiene icono decorativo y navega sin enviar (sin respuestas)", async () => {
      const { user } = renderPage();

      const exit = screen.getByRole("button", { name: "Salir" });
      expect(exit.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      await user.click(exit);

      expect(location()).toBe("/dashboard/roadmaps");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(submitAssessment).not.toHaveBeenCalled();
    });

    it("Salir con respuestas a medias navega sin confirmación ni submit", async () => {
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerCurrent(user, true);
      await answerCurrent(user, true);
      await user.click(screen.getByRole("button", { name: "Salir" }));

      expect(location()).toBe("/dashboard/roadmaps");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(submitAssessment).not.toHaveBeenCalled();
    });

    it("en móvil apila el encabezado y Salir; en fila desde md (sin recortar el wizard)", async () => {
      renderPage();

      const exit = screen.getByRole("button", { name: "Salir" });
      const header = exit.parentElement;
      expect(header?.tagName).toBe("HEADER");
      expect(header).toHaveClass("flex-col", "md:flex-row", "md:items-end", "md:justify-between");
      expect(exit).toHaveClass("self-start", "md:self-auto");
      // La sección crece con su contenido (min-h-full), en vez de quedar fija al alto de main.
      const section = header?.parentElement;
      expect(section).toHaveClass("min-h-full");
      expect(section).not.toHaveClass("h-full");
      await screen.findByRole("group", { name: FIRST.text });
    });

    it("no aplica la clase .nebula a ningún elemento", async () => {
      const { container } = renderPage();
      await screen.findByRole("group", { name: FIRST.text });
      expect(container.querySelector(".nebula")).toBeNull();
    });
  });

  describe("carga de preguntas", () => {
    it("muestra el esqueleto accesible mientras carga, sin wizard ni recuento", () => {
      vi.mocked(getAssessmentQuestions).mockReturnValue(new Promise(() => {}));
      renderPage();

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status).toHaveTextContent("Cargando preguntas…");
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      for (const name of ["Anterior", "Siguiente", SUBMIT_NAME]) {
        expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
      }
      expect(subtitle()).toHaveTextContent(NEUTRAL_SUBTITLE);
      expect(subtitle()).not.toHaveTextContent(/\d/);
      expect(subtitle()).not.toHaveTextContent(/Siete/);
      expect(screen.getByRole("heading", { level: 1, name: "Descubre tu ruta" })).toBeVisible();
      expect(screen.getByRole("navigation", { name: "Ruta de navegación" })).toBeInTheDocument();
    });

    it("Salir durante la carga navega a Mis Rutas", async () => {
      vi.mocked(getAssessmentQuestions).mockReturnValue(new Promise(() => {}));
      const { user } = renderPage();

      await expectExitNavigates(user);
    });

    it("al llegar las preguntas sustituye el esqueleto por la pregunta 1", async () => {
      const request = deferred<typeof ASSESSMENT_QUESTIONS_MOCK>();
      vi.mocked(getAssessmentQuestions).mockReturnValue(request.promise);
      renderPage();

      expect(screen.getByRole("status")).toBeInTheDocument();
      await act(async () => request.resolve(ASSESSMENT_QUESTIONS_MOCK));

      expect(await screen.findByRole("group", { name: FIRST.text })).toBeInTheDocument();
      expect(screen.getByText("Pregunta 1 de 7")).toBeInTheDocument();
      expect(screen.queryByText("Cargando preguntas…")).not.toBeInTheDocument();
      expect(subtitle()).toHaveTextContent(/^Siete preguntas rápidas/);
      expect(getAssessmentQuestions).toHaveBeenCalledTimes(1);
    });

    it("ordena las preguntas por order aunque el backend las devuelva desordenadas", async () => {
      vi.mocked(getAssessmentQuestions).mockResolvedValue([SECOND, FIRST]);
      renderPage();

      expect(await screen.findByRole("group", { name: FIRST.text })).toBeInTheDocument();
      expect(screen.getByText("Pregunta 1 de 2")).toBeInTheDocument();
    });
  });

  describe("error de carga", () => {
    it("muestra el mensaje del backend, Reintentar y subtítulo sin recuento", async () => {
      vi.mocked(getAssessmentQuestions).mockRejectedValue(
        buildAxiosError(500, "El servicio de preguntas no está disponible"),
      );
      const { user } = renderPage();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "El servicio de preguntas no está disponible",
      );
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(subtitle()).toHaveTextContent(NEUTRAL_SUBTITLE);
      expect(subtitle()).not.toHaveTextContent(/\d/);
      await expectExitNavigates(user);
    });

    it("con un error de red muestra el mensaje genérico de red", async () => {
      vi.mocked(getAssessmentQuestions).mockRejectedValue(buildNetworkError());
      renderPage();

      expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    });

    it("Reintentar vuelve a pedir las preguntas y muestra el wizard si ahora responden", async () => {
      vi.mocked(getAssessmentQuestions).mockRejectedValueOnce(buildAxiosError(500, "Caído"));
      const { user } = renderPage();

      await user.click(await screen.findByRole("button", { name: "Reintentar" }));

      expect(await screen.findByRole("group", { name: FIRST.text })).toBeInTheDocument();
      expect(screen.getByText("Pregunta 1 de 7")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(getAssessmentQuestions).toHaveBeenCalledTimes(2);
    });

    it("Reintentar que vuelve a fallar muestra otra vez el error y Reintentar", async () => {
      vi.mocked(getAssessmentQuestions).mockRejectedValueOnce(buildAxiosError(500, "Caído"));
      const retry = deferred<typeof ASSESSMENT_QUESTIONS_MOCK>();
      vi.mocked(getAssessmentQuestions).mockReturnValueOnce(retry.promise);
      const { user } = renderPage();

      await user.click(await screen.findByRole("button", { name: "Reintentar" }));
      // Sin datos previos, TanStack Query vuelve a `pending` durante el reintento: esqueleto.
      expect(await screen.findByText("Cargando preguntas…")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
      await act(async () => retry.reject(buildAxiosError(500, "Sigue caído")));

      expect(await screen.findByRole("alert")).toHaveTextContent("Sigue caído");
      expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(getAssessmentQuestions).toHaveBeenCalledTimes(2);
    });
  });

  describe("lista vacía", () => {
    it("muestra el mensaje de lista vacía sin wizard ni recuento, y Salir funciona", async () => {
      vi.mocked(getAssessmentQuestions).mockResolvedValue([]);
      const { user } = renderPage();

      expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: SUBMIT_NAME })).not.toBeInTheDocument();
      expect(screen.queryByText(/^Pregunta \d/)).not.toBeInTheDocument();
      expect(subtitle()).toHaveTextContent(NEUTRAL_SUBTITLE);
      expect(subtitle()).not.toHaveTextContent(/\d/);
      await expectExitNavigates(user);
    });
  });

  describe("envío correcto", () => {
    it("manda { answers } en orden (con una respuesta cambiada) y navega al detalle de la ruta generada", async () => {
      const consoleSpies = (["log", "info", "warn", "error"] as const).map((method) =>
        vi.spyOn(console, method),
      );
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      // Primera respuesta y después se cambia por la segunda opción.
      await user.click(screen.getAllByRole("radio")[0]);
      await user.click(screen.getAllByRole("radio")[1]);
      await user.click(screen.getByRole("button", { name: "Siguiente" }));
      for (let index = 1; index < ASSESSMENT_QUESTIONS_MOCK.length; index++) {
        await answerCurrent(user, index < ASSESSMENT_QUESTIONS_MOCK.length - 1);
      }
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(submitAssessment).toHaveBeenCalledTimes(1);
      const [payload] = vi.mocked(submitAssessment).mock.calls[0];
      expect(payload).toEqual({
        answers: ASSESSMENT_QUESTIONS_MOCK.map((question, index) => ({
          questionId: question.id,
          optionId: question.options[index === 0 ? 1 : 0].id,
        })),
      });
      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
      for (const spy of consoleSpies) {
        expect(spy).not.toHaveBeenCalled();
      }
    });

    it("mientras envía el CTA está en carga, no navega y no duplica el envío", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      const sending = await screen.findByRole("button", { name: "Enviando…" });
      expect(sending).toBeDisabled();
      expect(sending).toHaveAttribute("aria-busy", "true");
      await user.click(sending);
      expect(submitAssessment).toHaveBeenCalledTimes(1);
      expect(location()).toBe("/dashboard/roadmaps/new");

      await act(async () => request.resolve(buildAssessmentResultMock({ answers: [] })));

      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
    });

    it("tras el envío, volver atrás desde el detalle no regresa al cuestionario (la entrada /new se reemplazó)", async () => {
      const { user } = renderPage({
        initialEntries: ["/dashboard/roadmaps", "/dashboard/roadmaps/new"],
        initialIndex: 1,
      });

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Atrás" }));

      expect(location()).toBe("/dashboard/roadmaps");
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(FAILED_NOTICE)).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: FIRST.text })).not.toBeInTheDocument();
      expect(submitAssessment).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["FAILED", buildAssessmentResultFailedMock],
      [
        "sin roadmap en la respuesta",
        (input: Parameters<typeof buildAssessmentResultMock>[0]): AssessmentResult => {
          const { roadmap: _roadmap, ...rest } = buildAssessmentResultMock(input);
          return rest;
        },
      ],
      [
        "FAILED aunque traiga id",
        (input: Parameters<typeof buildAssessmentResultMock>[0]): AssessmentResult => ({
          ...buildAssessmentResultMock(input),
          roadmap: { status: "FAILED", id: MOCK_GENERATED_ROADMAP_ID },
        }),
      ],
    ])("si la ruta no se generó (%s) navega a Mis Rutas con el aviso", async (_label, build) => {
      vi.mocked(submitAssessment).mockImplementation((input) => Promise.resolve(build(input)));
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Mis Rutas" }),
      ).toBeInTheDocument();
      expect(location()).toBe("/dashboard/roadmaps");
      expect(screen.getByText(FAILED_NOTICE)).toHaveAttribute("role", "status");
      expect(screen.queryByText(DETAIL_STUB)).not.toBeInTheDocument();
    });

    it("con status EXISTS e id también navega al detalle", async () => {
      vi.mocked(submitAssessment).mockImplementation((input) =>
        Promise.resolve({
          ...buildAssessmentResultMock(input),
          roadmap: { status: "EXISTS", id: MOCK_GENERATED_ROADMAP_ID },
        }),
      );
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
    });
  });

  describe("error de envío", () => {
    it("con 400 muestra el mensaje, conserva las respuestas y reenviar navega al detalle", async () => {
      vi.mocked(submitAssessment).mockRejectedValueOnce(
        buildAxiosError(400, "Faltan respuestas del cuestionario"),
      );
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Faltan respuestas del cuestionario",
      );
      expect(location()).toBe("/dashboard/roadmaps/new");
      const lastGroup = screen.getByRole("group", { name: LAST.text });
      expect(within(lastGroup).getAllByRole("radio")[0]).toBeChecked();

      await user.click(screen.getByRole("button", { name: "Anterior" }));
      const previousGroup = screen.getByRole("group", {
        name: ASSESSMENT_QUESTIONS_MOCK[ASSESSMENT_QUESTIONS_MOCK.length - 2].text,
      });
      expect(within(previousGroup).getAllByRole("radio")[0]).toBeChecked();
      await user.click(screen.getByRole("button", { name: "Siguiente" }));

      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(submitAssessment).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
    });

    it("con un error de red muestra el mensaje de red y sigue en el cuestionario", async () => {
      vi.mocked(submitAssessment).mockRejectedValueOnce(buildNetworkError());
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(location()).toBe("/dashboard/roadmaps/new");
      expect(
        within(screen.getByRole("group", { name: LAST.text })).getAllByRole("radio")[0],
      ).toBeChecked();
      expect(screen.getByRole("button", { name: SUBMIT_NAME })).toBeEnabled();
    });
  });

  describe("caché y revalidación", () => {
    it("una revalidación fallida con el wizard visible no lo desmonta ni pierde respuestas", async () => {
      const { user, queryClient } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerCurrent(user, true);
      await answerCurrent(user, true);
      expect(screen.getByRole("group", { name: THIRD.text })).toBeInTheDocument();

      vi.mocked(getAssessmentQuestions).mockRejectedValueOnce(buildAxiosError(500, "Caído"));
      await act(() => queryClient.refetchQueries({ queryKey: assessmentsKeys.questions() }));

      expect(getAssessmentQuestions).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("group", { name: THIRD.text })).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Anterior" }));
      expect(
        within(screen.getByRole("group", { name: SECOND.text })).getAllByRole("radio")[0],
      ).toBeChecked();
      await user.click(screen.getByRole("button", { name: "Anterior" }));
      expect(
        within(screen.getByRole("group", { name: FIRST.text })).getAllByRole("radio")[0],
      ).toBeChecked();
    });

    it("al reentrar con preguntas frescas en caché muestra la P1 sin esqueleto, respuestas ni petición", () => {
      vi.mocked(getAssessmentQuestions).mockReturnValue(new Promise(() => {}));
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(assessmentsKeys.questions(), ASSESSMENT_QUESTIONS_MOCK);
      renderPage({ route: "/dashboard/roadmaps/new", queryClient });

      const group = screen.getByRole("group", { name: FIRST.text });
      expect(screen.getByText("Pregunta 1 de 7")).toBeInTheDocument();
      expect(screen.queryByText("Cargando preguntas…")).not.toBeInTheDocument();
      for (const radio of within(group).getAllByRole("radio")) {
        expect(radio).not.toBeChecked();
      }
      expect(getAssessmentQuestions).not.toHaveBeenCalled();
    });

    it("al reentrar con preguntas caducadas en caché muestra la P1 y revalida en segundo plano", async () => {
      vi.mocked(getAssessmentQuestions).mockReturnValue(new Promise(() => {}));
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(assessmentsKeys.questions(), ASSESSMENT_QUESTIONS_MOCK, {
        updatedAt: Date.now() - ASSESSMENT_QUESTIONS_STALE_TIME - 1,
      });
      renderPage({ route: "/dashboard/roadmaps/new", queryClient });

      expect(screen.getByRole("group", { name: FIRST.text })).toBeInTheDocument();
      expect(screen.queryByText("Cargando preguntas…")).not.toBeInTheDocument();
      await waitFor(() => expect(getAssessmentQuestions).toHaveBeenCalledTimes(1));
    });
  });

  describe("diálogo de espera", () => {
    /** Responde todo, pulsa el CTA y devuelve el diálogo de espera ya abierto. */
    async function submitAndWait(user: User) {
      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      return screen.findByRole("dialog", { name: ASSESSMENT_GENERATING_TITLE });
    }

    it("no aparece antes de enviar y la live region está montada y vacía", async () => {
      // El bloqueo se comprueba al empezar este test, no al final del anterior.
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      renderPage();

      await screen.findByRole("group", { name: FIRST.text });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      expect(announcer()).toBeEmptyDOMElement();
    });

    it("con el envío en curso abre el diálogo en la primera etapa y bloquea el scroll", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      const dialog = await submitAndWait(user);

      expect(dialog).toHaveAccessibleName(ASSESSMENT_GENERATING_TITLE);
      expect(stageText()).toBe(SAVING_STAGE.message);
      expect(document.documentElement).toHaveClass(SCROLL_LOCK);
      const sending = screen.getByRole("button", { name: "Enviando…" });
      expect(sending).toBeDisabled();
      expect(sending).toHaveAttribute("aria-busy", "true");
    });

    it("al resolver con la ruta generada cierra el diálogo, libera el scroll y navega al detalle", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await submitAndWait(user);
      await act(async () => request.resolve(buildAssessmentResultMock({ answers: [] })));

      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      // La página se desmontó al navegar: con ella se va su live region.
      expect(screen.queryByTestId("assessment-generating-announcer")).not.toBeInTheDocument();
    });

    it("al fallar con 400 cierra el diálogo y muestra el mensaje del backend sin perder respuestas", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await submitAndWait(user);
      await act(async () => request.reject(buildAxiosError(400, BACKEND_400_MESSAGE)));

      expect(await screen.findByRole("alert")).toHaveTextContent(BACKEND_400_MESSAGE);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      expect(location()).toBe("/dashboard/roadmaps/new");
      expect(
        within(screen.getByRole("group", { name: LAST.text })).getAllByRole("radio")[0],
      ).toBeChecked();
    });

    it("«Salir» no navega durante el envío y vuelve a funcionar tras el error", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await submitAndWait(user);
      const exit = screen.getByRole("button", { name: "Salir" });
      expect(exit).toBeDisabled();
      await user.click(exit);

      expect(location()).toBe("/dashboard/roadmaps/new");
      expect(generatingDialog()).toBeInTheDocument();

      await act(async () => request.reject(buildNetworkError()));
      expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);

      await expectExitNavigates(user);
    });

    it("el reintento vuelve a abrir el diálogo en la primera etapa y borra el aviso anterior", async () => {
      vi.mocked(submitAssessment).mockRejectedValueOnce(buildAxiosError(400, BACKEND_400_MESSAGE));
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      expect(await screen.findByRole("alert")).toHaveTextContent(BACKEND_400_MESSAGE);

      // La respuesta del reintento se encola cuando la primera ya se consumió: `restoreMocks` no
      // vacía las colas de `mock*Once` y el sobrante se filtraría al test siguiente.
      const retry = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(retry.promise);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      expect(
        await screen.findByRole("dialog", { name: ASSESSMENT_GENERATING_TITLE }),
      ).toBeVisible();
      expect(stageText()).toBe(SAVING_STAGE.message);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("la espera agotada muestra el mensaje dedicado y deja el cuestionario recuperable", async () => {
      const consoleSpies = (["log", "info", "warn", "error"] as const).map((method) =>
        vi.spyOn(console, method),
      );
      vi.mocked(submitAssessment).mockRejectedValueOnce(buildTimeoutError());
      const { user } = renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE);
      expect(alert).not.toHaveTextContent(NETWORK_MESSAGE);
      expect(ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE).not.toBe(NETWORK_MESSAGE);
      expect(location()).toBe("/dashboard/roadmaps/new");
      expect(
        within(screen.getByRole("group", { name: LAST.text })).getAllByRole("radio")[0],
      ).toBeChecked();
      expect(screen.getByRole("button", { name: SUBMIT_NAME })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Salir" })).toBeEnabled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      for (const spy of consoleSpies) {
        expect(spy).not.toHaveBeenCalled();
      }
    });

    it("un cierre nativo durante el envío restablece la espera", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await submitAndWait(user);
      closeDialogNatively();

      expect(generatingDialog()).toBeInTheDocument();
      expect(document.documentElement).toHaveClass(SCROLL_LOCK);
      expect(stageText()).toBe(SAVING_STAGE.message);
    });

    it("superada la cota deja de reabrir sin perder el envío ni las respuestas", async () => {
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      const { user } = renderPage();

      await submitAndWait(user);
      for (let i = 0; i <= MAX_GENERATING_REOPENS; i += 1) {
        closeDialogNatively();
      }

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
      expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
      expect(
        within(screen.getByRole("group", { name: LAST.text })).getAllByRole("radio")[0],
      ).toBeChecked();

      await act(async () => request.resolve(buildAssessmentResultMock({ answers: [] })));

      expect(await screen.findByText(DETAIL_STUB)).toBeInTheDocument();
      expect(location()).toBe(DETAIL_PATH);
    });
  });

  describe("narración de la espera", () => {
    // Testing Library solo detecta los temporizadores falsos de Jest: sin el stub global los
    // `findBy*` se cuelgan. Aislado en este describe; el resto del fichero usa relojes reales.
    function useFakeTimersForTestingLibrary() {
      vi.useFakeTimers();
      vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
      return userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    async function advance(ms: number) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    }

    /** Deja un envío en curso y el diálogo abierto, sin depender de `waitFor`. */
    async function startSubmit(user: User) {
      await screen.findByRole("group", { name: FIRST.text });
      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      await advance(0);
      expect(generatingDialog()).toBeInTheDocument();
    }

    it("avanza de etapa por tiempo y la última aguanta", async () => {
      const user = useFakeTimersForTestingLibrary();
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      renderPage();

      await startSubmit(user);
      expect(stageText()).toBe(SAVING_STAGE.message);

      await advance(6_999);
      expect(stageText()).toBe(SAVING_STAGE.message);

      await advance(1);
      expect(stageText()).toBe(ANALYZING_STAGE.message);

      await advance(11_000);
      expect(stageText()).toBe(BUILDING_STAGE.message);

      await advance(102_000);
      expect(stageText()).toBe(BUILDING_STAGE.message);
      expect(generatingDialog()).toBeInTheDocument();
    });

    it("la live region anuncia solo la primera y la última etapa, y se vacía al terminar", async () => {
      const user = useFakeTimersForTestingLibrary();
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      renderPage();

      await screen.findByRole("group", { name: FIRST.text });
      expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
      expect(announcer()).toBeEmptyDOMElement();

      await answerAll(user);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      await advance(0);

      expect(generatingDialog().contains(announcer())).toBe(false);
      expect(announcer()).toHaveTextContent(SAVING_ANNOUNCEMENT);

      await advance(7_000);
      expect(stageText()).toBe(ANALYZING_STAGE.message);
      expect(announcer()).toHaveTextContent(SAVING_ANNOUNCEMENT);

      await advance(11_000);
      expect(stageText()).toBe(BUILDING_STAGE.message);
      expect(announcer()).toHaveTextContent(BUILDING_ANNOUNCEMENT);

      await act(async () => request.reject(buildNetworkError()));
      await advance(0);

      expect(screen.getByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(announcer()).toBeEmptyDOMElement();
    });

    it("el reintento narra otra vez desde la primera etapa", async () => {
      const user = useFakeTimersForTestingLibrary();
      const first = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(first.promise);
      renderPage();

      await startSubmit(user);
      await advance(18_000);
      expect(stageText()).toBe(BUILDING_STAGE.message);

      await act(async () => first.reject(buildAxiosError(400, BACKEND_400_MESSAGE)));
      await advance(0);
      expect(screen.getByRole("alert")).toHaveTextContent(BACKEND_400_MESSAGE);

      const retry = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(retry.promise);
      await user.click(screen.getByRole("button", { name: SUBMIT_NAME }));
      await advance(0);

      expect(generatingDialog()).toBeInTheDocument();
      expect(stageText()).toBe(SAVING_STAGE.message);
      expect(announcer()).toHaveTextContent(SAVING_ANNOUNCEMENT);
    });

    it("terminado el envío no quedan temporizadores vivos", async () => {
      const errorSpy = vi.spyOn(console, "error");
      const user = useFakeTimersForTestingLibrary();
      const request = deferred<AssessmentResult>();
      vi.mocked(submitAssessment).mockReturnValue(request.promise);
      renderPage();

      await startSubmit(user);
      await advance(7_000);
      await act(async () => request.reject(buildNetworkError()));
      await advance(0);
      expect(screen.getByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);

      await advance(120_000);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(announcer()).toBeEmptyDOMElement();
      expect(screen.getByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});

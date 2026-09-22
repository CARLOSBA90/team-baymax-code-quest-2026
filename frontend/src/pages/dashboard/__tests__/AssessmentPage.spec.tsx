import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ASSESSMENT_QUESTIONS_MOCK } from "@/api/mocks/assessments";
import { submitAssessment } from "@/api/services";
import { AssessmentPage } from "@/pages";
import { renderWithProviders } from "@/test/renderWithProviders";

// Se usa el mock real; `submitAssessment` se envuelve en un `vi.fn` que delega en el original
// para poder contar llamadas y forzar un rechazo puntual.
vi.mock("@/api/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/services")>();
  return { ...actual, submitAssessment: vi.fn(actual.submitAssessment) };
});

const CTA = "Descubrir mi ruta de aprendizaje";
const FIRST = ASSESSMENT_QUESTIONS_MOCK[0];
const LAST = ASSESSMENT_QUESTIONS_MOCK[ASSESSMENT_QUESTIONS_MOCK.length - 1];

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderPage() {
  const utils = renderWithProviders(
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<p>Estado vacío</p>} />
        <Route path="/dashboard/roadmaps/new" element={<AssessmentPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route: "/dashboard/roadmaps/new" },
  );
  return { ...utils, user: userEvent.setup() };
}

function location() {
  return screen.getByTestId("location").textContent;
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

describe("AssessmentPage", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("muestra el breadcrumb con nombre accesible propio", () => {
    renderPage();

    const breadcrumb = screen.getByRole("navigation", { name: "Ruta de navegación" });
    expect(within(breadcrumb).getByRole("link", { name: "Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );
    const current = within(breadcrumb).getByText("Nueva ruta");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(within(breadcrumb).queryByRole("link", { name: "Nueva ruta" })).not.toBeInTheDocument();
    expect(current.closest("a")).toBeNull();
  });

  it("el enlace Mis Rutas del breadcrumb navega a /dashboard/roadmaps", async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole("link", { name: "Mis Rutas" }));

    expect(location()).toBe("/dashboard/roadmaps");
    expect(screen.getByText("Estado vacío")).toBeInTheDocument();
  });

  it("muestra el h1 y el subtítulo derivado de las 7 preguntas", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Descubre tu ruta" })).toBeInTheDocument();
    expect(screen.getByText(/^Siete preguntas rápidas/)).toBeInTheDocument();
    expect(screen.queryByText(/Cinco/)).not.toBeInTheDocument();
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

    await answerCurrent(user, true);
    await answerCurrent(user, true);
    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(location()).toBe("/dashboard/roadmaps");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it("muestra la primera pregunta del seed en el primer render, sin estado de carga", () => {
    const { container } = renderPage();

    const group = screen.getByRole("group", { name: FIRST.text });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("heading", { level: 2, name: FIRST.text })).toBeInTheDocument();
    expect(screen.queryByText(/Cargando/)).not.toBeInTheDocument();
    expect(container.querySelector("[aria-busy='true']")).toBeNull();
  });

  it("al enviar las 7 respuestas registra petición y respuesta OK sin navegar", async () => {
    const { user } = renderPage();

    await answerAll(user);
    await user.click(screen.getByRole("button", { name: CTA }));

    expect(submitAssessment).toHaveBeenCalledTimes(1);
    const [payload] = vi.mocked(submitAssessment).mock.calls[0];
    expect(payload.answers).toEqual(
      ASSESSMENT_QUESTIONS_MOCK.map((question) => ({
        questionId: question.id,
        optionId: question.options[0].id,
      })),
    );

    await waitFor(() =>
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("respuesta OK"),
        expect.anything(),
      ),
    );
    const messages = vi.mocked(console.info).mock.calls.map(([message]) => String(message));
    const sentIndex = messages.findIndex((message) => message.includes("petición enviada"));
    const okIndex = messages.findIndex((message) => message.includes("respuesta OK"));
    expect(sentIndex).toBeGreaterThanOrEqual(0);
    expect(okIndex).toBeGreaterThan(sentIndex);

    expect(location()).toBe("/dashboard/roadmaps/new");
    expect(screen.getByRole("heading", { level: 2, name: LAST.text })).toBeInTheDocument();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("si el submit rechaza, registra el error, sigue montada y permite reintentar", async () => {
    vi.mocked(submitAssessment).mockRejectedValueOnce(new Error("fallo de red"));
    const { user } = renderPage();

    await answerAll(user);
    await user.click(screen.getByRole("button", { name: CTA }));

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("error en el envío"),
        expect.any(Error),
      ),
    );
    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining("respuesta OK"),
      expect.anything(),
    );
    expect(screen.getByRole("heading", { level: 1, name: "Descubre tu ruta" })).toBeInTheDocument();
    expect(location()).toBe("/dashboard/roadmaps/new");

    const cta = await screen.findByRole("button", { name: CTA });
    await waitFor(() => expect(cta).toBeEnabled());

    await user.click(cta);
    expect(submitAssessment).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("respuesta OK"),
        expect.anything(),
      ),
    );
  });

  it("no aplica la clase .nebula a ningún elemento", () => {
    const { container } = renderPage();
    expect(container.querySelector(".nebula")).toBeNull();
  });
});

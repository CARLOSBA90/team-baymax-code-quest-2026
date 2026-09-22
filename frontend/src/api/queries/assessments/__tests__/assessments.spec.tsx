import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { ASSESSMENT_QUESTIONS_MOCK } from "@/api/mocks/assessments";
import { useAssessmentQuestions } from "@/api/queries/assessments";
import { getAssessmentQuestions, submitAssessment } from "@/api/services";
import type { SkillCategory } from "@/types";

// Tabla de `questionsToSeed` en backend/prisma/seed.ts (sin `value`).
const SEED: { order: number; category: SkillCategory; text: string; options: string[] }[] = [
  {
    order: 1,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cuál es tu principal objetivo profesional en este momento?",
    options: [
      "Construir interfaces de usuario y aplicaciones web interactivas",
      "Diseñar servidores, APIs robustas y arquitecturas escalables",
      "Crear aplicaciones para dispositivos móviles iOS y Android",
      "Estoy empezando desde cero en el mundo de la programación",
    ],
  },
  {
    order: 2,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cómo describirías tu nivel actual de lógica y fundamentos de programación?",
    options: [
      "Nunca he escrito una línea de código",
      "Conozco variables, bucles y condicionales básicos",
      "Domino la programación estructurada y tipado con TypeScript",
      "Tengo bases sólidas y aplico principios SOLID y patrones de diseño",
    ],
  },
  {
    order: 3,
    category: "FRONTEND",
    text: "¿Cuál es tu experiencia construyendo interfaces con frameworks web modernos?",
    options: [
      "Ninguna, solo conozco lo básico de HTML y CSS",
      "He probado React, Angular o Vue en proyectos pequeños o tutoriales",
      "Construyo aplicaciones completas con gestión de estado global",
      "Desarrollo aplicaciones en producción con SSR y frameworks fullstack como Next.js o Nuxt",
    ],
  },
  {
    order: 4,
    category: "BACKEND",
    text: "¿Cuál es tu nivel desarrollando APIs y trabajando con bases de datos?",
    options: [
      "No tengo experiencia con servidores ni bases de datos",
      "He realizado consultas básicas en SQL con PostgreSQL o scripts sencillos",
      "He creado APIs REST funcionales con Node.js, Python, Java o C#",
      "Diseño arquitecturas avanzadas como Microservicios, Arquitectura Hexagonal o GraphQL",
    ],
  },
  {
    order: 5,
    category: "BACKEND",
    text: "¿Cómo te gustaría integrar Inteligencia Artificial en tu ruta de aprendizaje?",
    options: [
      "Por ahora prefiero consolidar las bases tradicionales de desarrollo",
      "Quiero aprender a usar herramientas de asistencia y técnicas de prompts",
      "Quiero construir aplicaciones que consuman modelos LLM y técnicas de RAG",
      "Quiero desarrollar agentes autónomos y flujos de automatización con n8n y MCP",
    ],
  },
  {
    order: 6,
    category: "DEVOPS",
    text: "¿Tienes interés en complementar tu formación con DevOps o Testing?",
    options: [
      "No por el momento, quiero enfocarme exclusivamente en escribir código de aplicación",
      "Me interesa aprender Docker y gestión de contenedores",
      "Me interesa dominar pruebas unitarias y pruebas de extremo a extremo e2e",
    ],
  },
  {
    order: 7,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cuánto tiempo estimado puedes dedicar al estudio de forma semanal?",
    options: [
      "Menos de 3 horas por semana (Ruta sugerida corta: 2 a 3 cursos)",
      "Entre 4 y 7 horas por semana (Ruta sugerida estándar: 4 a 5 cursos)",
      "Más de 8 horas por semana (Ruta sugerida intensiva: hasta 8 cursos)",
    ],
  },
];

function wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("mock de assessments", () => {
  it("reproduce la tabla del seed: 7 preguntas con su orden, categoría, texto y opciones", () => {
    expect(ASSESSMENT_QUESTIONS_MOCK).toHaveLength(7);
    expect(
      ASSESSMENT_QUESTIONS_MOCK.map((question) => ({
        order: question.order,
        category: question.category,
        text: question.text,
        options: [...question.options]
          .sort((a, b) => a.order - b.order)
          .map((option) => option.text),
      })),
    ).toEqual(SEED);
  });

  it("los órdenes de las opciones son 1..N consecutivos", () => {
    for (const question of ASSESSMENT_QUESTIONS_MOCK) {
      expect(question.options.map((option) => option.order)).toEqual(
        question.options.map((_, index) => index + 1),
      );
    }
  });

  it("los ids de preguntas y opciones son únicos", () => {
    const questionIds = ASSESSMENT_QUESTIONS_MOCK.map((question) => question.id);
    const optionIds = ASSESSMENT_QUESTIONS_MOCK.flatMap((question) =>
      question.options.map((option) => option.id),
    );
    expect(new Set(questionIds).size).toBe(questionIds.length);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(new Set([...questionIds, ...optionIds]).size).toBe(
      questionIds.length + optionIds.length,
    );
  });

  it("los ids son estables entre llamadas al servicio", async () => {
    const first = await getAssessmentQuestions();
    const second = await getAssessmentQuestions();
    expect(second.map((question) => question.id)).toEqual(first.map((question) => question.id));
    expect(second.flatMap((q) => q.options.map((o) => o.id))).toEqual(
      first.flatMap((q) => q.options.map((o) => o.id)),
    );
  });

  it("ninguna opción expone value ni description", () => {
    for (const question of ASSESSMENT_QUESTIONS_MOCK) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty("value");
        expect(option).not.toHaveProperty("description");
        expect(Object.keys(option).sort()).toEqual(["id", "order", "text"]);
      }
    }
  });
});

describe("useAssessmentQuestions", () => {
  it("devuelve las 7 preguntas en el primer render, sin estado pendiente", () => {
    const { result } = renderHook(() => useAssessmentQuestions(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toHaveLength(7);
    expect(result.current.data).toEqual(ASSESSMENT_QUESTIONS_MOCK);
  });
});

describe("submitAssessment (mock)", () => {
  it("resuelve un AssessmentResult completo", async () => {
    const result = await submitAssessment({
      answers: [{ questionId: "mock-question-1", optionId: "mock-q1-option-1" }],
    });

    expect(result).toEqual({
      id: expect.any(String),
      userId: expect.any(String),
      version: expect.any(Number),
      goalCategory: null,
      profileScores: null,
      completedAt: expect.any(String),
      createdAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(result.completedAt ?? ""))).toBe(false);
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
  });
});

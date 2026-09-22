import type { AssessmentQuestion, AssessmentResult, SubmitAssessmentInput } from "@/types";

// Mock temporal: copia literal de `questionsToSeed` en backend/prisma/seed.ts (sin `value`).
// Se borra al migrar el servicio a HTTP.

function buildOptions(questionOrder: number, texts: string[]): AssessmentQuestion["options"] {
  return texts.map((text, index) => ({
    id: `mock-q${questionOrder}-option-${index + 1}`,
    order: index + 1,
    text,
  }));
}

export const ASSESSMENT_QUESTIONS_MOCK: AssessmentQuestion[] = [
  {
    id: "mock-question-1",
    order: 1,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cuál es tu principal objetivo profesional en este momento?",
    options: buildOptions(1, [
      "Construir interfaces de usuario y aplicaciones web interactivas",
      "Diseñar servidores, APIs robustas y arquitecturas escalables",
      "Crear aplicaciones para dispositivos móviles iOS y Android",
      "Estoy empezando desde cero en el mundo de la programación",
    ]),
  },
  {
    id: "mock-question-2",
    order: 2,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cómo describirías tu nivel actual de lógica y fundamentos de programación?",
    options: buildOptions(2, [
      "Nunca he escrito una línea de código",
      "Conozco variables, bucles y condicionales básicos",
      "Domino la programación estructurada y tipado con TypeScript",
      "Tengo bases sólidas y aplico principios SOLID y patrones de diseño",
    ]),
  },
  {
    id: "mock-question-3",
    order: 3,
    category: "FRONTEND",
    text: "¿Cuál es tu experiencia construyendo interfaces con frameworks web modernos?",
    options: buildOptions(3, [
      "Ninguna, solo conozco lo básico de HTML y CSS",
      "He probado React, Angular o Vue en proyectos pequeños o tutoriales",
      "Construyo aplicaciones completas con gestión de estado global",
      "Desarrollo aplicaciones en producción con SSR y frameworks fullstack como Next.js o Nuxt",
    ]),
  },
  {
    id: "mock-question-4",
    order: 4,
    category: "BACKEND",
    text: "¿Cuál es tu nivel desarrollando APIs y trabajando con bases de datos?",
    options: buildOptions(4, [
      "No tengo experiencia con servidores ni bases de datos",
      "He realizado consultas básicas en SQL con PostgreSQL o scripts sencillos",
      "He creado APIs REST funcionales con Node.js, Python, Java o C#",
      "Diseño arquitecturas avanzadas como Microservicios, Arquitectura Hexagonal o GraphQL",
    ]),
  },
  {
    id: "mock-question-5",
    order: 5,
    category: "BACKEND",
    text: "¿Cómo te gustaría integrar Inteligencia Artificial en tu ruta de aprendizaje?",
    options: buildOptions(5, [
      "Por ahora prefiero consolidar las bases tradicionales de desarrollo",
      "Quiero aprender a usar herramientas de asistencia y técnicas de prompts",
      "Quiero construir aplicaciones que consuman modelos LLM y técnicas de RAG",
      "Quiero desarrollar agentes autónomos y flujos de automatización con n8n y MCP",
    ]),
  },
  {
    id: "mock-question-6",
    order: 6,
    category: "DEVOPS",
    text: "¿Tienes interés en complementar tu formación con DevOps o Testing?",
    options: buildOptions(6, [
      "No por el momento, quiero enfocarme exclusivamente en escribir código de aplicación",
      "Me interesa aprender Docker y gestión de contenedores",
      "Me interesa dominar pruebas unitarias y pruebas de extremo a extremo e2e",
    ]),
  },
  {
    id: "mock-question-7",
    order: 7,
    category: "WEB_FUNDAMENTALS",
    text: "¿Cuánto tiempo estimado puedes dedicar al estudio de forma semanal?",
    options: buildOptions(7, [
      "Menos de 3 horas por semana (Ruta sugerida corta: 2 a 3 cursos)",
      "Entre 4 y 7 horas por semana (Ruta sugerida estándar: 4 a 5 cursos)",
      "Más de 8 horas por semana (Ruta sugerida intensiva: hasta 8 cursos)",
    ]),
  },
];

/** `input` no se usa para puntuar: el mock no calcula `profileScores`. */
export function buildAssessmentResultMock(_input: SubmitAssessmentInput): AssessmentResult {
  const now = new Date().toISOString();
  return {
    id: "mock-assessment-result",
    userId: "mock-user",
    version: 1,
    goalCategory: null,
    profileScores: null,
    completedAt: now,
    createdAt: now,
  };
}

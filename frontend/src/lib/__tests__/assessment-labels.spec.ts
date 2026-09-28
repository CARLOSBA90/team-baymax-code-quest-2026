import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_GENERATING_DESCRIPTION,
  ASSESSMENT_GENERATING_STAGES,
  ASSESSMENT_GENERATING_TITLE,
  DEFAULT_ASSESSMENT_HELPER_TEXT,
  getAssessmentGeneratingAnnouncement,
  getAssessmentGeneratingStage,
  getAssessmentSubtitle,
  getSkillCategoryLabel,
  SKILL_CATEGORY_LABELS,
} from "@/lib";
import type { SkillCategory } from "@/types";

const ALL_CATEGORIES: SkillCategory[] = [
  "BACKEND",
  "FRONTEND",
  "DEVOPS",
  "DATABASES",
  "MOBILE",
  "TESTING",
  "WEB_FUNDAMENTALS",
];

describe("SKILL_CATEGORY_LABELS", () => {
  it("cubre las 7 categorías con una etiqueta no vacía", () => {
    expect(Object.keys(SKILL_CATEGORY_LABELS).sort()).toEqual([...ALL_CATEGORIES].sort());
    for (const category of ALL_CATEGORIES) {
      expect(SKILL_CATEGORY_LABELS[category].trim()).not.toBe("");
    }
  });

  it("getSkillCategoryLabel devuelve la etiqueta del mapa", () => {
    expect(getSkillCategoryLabel("WEB_FUNDAMENTALS")).toBe("Fundamentos");
    expect(getSkillCategoryLabel("DEVOPS")).toBe("DevOps");
  });
});

describe("DEFAULT_ASSESSMENT_HELPER_TEXT", () => {
  it("es el texto de ayuda por defecto", () => {
    expect(DEFAULT_ASSESSMENT_HELPER_TEXT).toBe("Elige una opción.");
  });
});

describe("getAssessmentSubtitle", () => {
  it("usa singular con 1 pregunta", () => {
    expect(getAssessmentSubtitle(1)).toMatch(/^Una pregunta rápida\. /);
  });

  it("refleja 3 preguntas sin 'Cinco' ni '7'", () => {
    const subtitle = getAssessmentSubtitle(3);
    expect(subtitle).toMatch(/^Tres preguntas rápidas\. /);
    expect(subtitle).not.toContain("Cinco");
    expect(subtitle).not.toContain("7");
  });

  it("usa 'Cinco' con 5 preguntas", () => {
    expect(getAssessmentSubtitle(5)).toMatch(/^Cinco preguntas rápidas\. /);
  });

  it("usa 'Siete' con 7 preguntas", () => {
    expect(getAssessmentSubtitle(7)).toMatch(/^Siete preguntas rápidas\. /);
  });

  it("usa 'Diez' con 10 preguntas", () => {
    expect(getAssessmentSubtitle(10)).toMatch(/^Diez preguntas rápidas\. /);
  });

  it("usa dígitos con más de 10 preguntas", () => {
    expect(getAssessmentSubtitle(12)).toMatch(/^12 preguntas rápidas\. /);
  });

  it.each([
    ["sin recuento", undefined],
    ["con 0", 0],
  ])("devuelve el texto neutro %s, sin número", (_label, count) => {
    const subtitle = getAssessmentSubtitle(count);
    expect(subtitle).toBe(
      "Unas preguntas rápidas. Con tus respuestas elegimos los cursos de DevTalles y el orden en que te conviene tomarlos.",
    );
    expect(subtitle).not.toMatch(/\d/);
    expect(subtitle).not.toMatch(/\bUna\b/);
    expect(subtitle).not.toContain("Siete");
  });
});

describe("narración de la espera de generación", () => {
  const [first, middle, last] = ASSESSMENT_GENERATING_STAGES;

  it("tiene tres etapas con los ids en orden", () => {
    expect(ASSESSMENT_GENERATING_STAGES).toHaveLength(3);
    expect(ASSESSMENT_GENERATING_STAGES.map((stage) => stage.id)).toEqual([
      "saving",
      "analyzing",
      "building",
    ]);
  });

  it("empieza en 0 ms y los umbrales son estrictamente crecientes", () => {
    expect(first.delayMs).toBe(0);
    for (let i = 1; i < ASSESSMENT_GENERATING_STAGES.length; i += 1) {
      expect(ASSESSMENT_GENERATING_STAGES[i].delayMs).toBeGreaterThan(
        ASSESSMENT_GENERATING_STAGES[i - 1].delayMs,
      );
    }
  });

  it("solo la primera y la última etapa se anuncian", () => {
    expect(first.announcement).not.toBeNull();
    expect(middle.announcement).toBeNull();
    expect(last.announcement).not.toBeNull();
  });

  it("los tres mensajes visibles son no vacíos y distintos entre sí", () => {
    const messages = ASSESSMENT_GENERATING_STAGES.map((stage) => stage.message);
    for (const message of messages) {
      expect(message.trim()).not.toBe("");
    }
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("getAssessmentGeneratingStage acota los índices fuera de rango", () => {
    expect(getAssessmentGeneratingStage(0)).toBe(first);
    expect(getAssessmentGeneratingStage(1)).toBe(middle);
    expect(getAssessmentGeneratingStage(2)).toBe(last);
    expect(getAssessmentGeneratingStage(-1)).toBe(first);
    expect(getAssessmentGeneratingStage(99)).toBe(last);
  });

  it("getAssessmentGeneratingAnnouncement conserva el anuncio de la primera etapa en la intermedia", () => {
    expect(getAssessmentGeneratingAnnouncement(0)).toBe(first.announcement);
    expect(getAssessmentGeneratingAnnouncement(1)).toBe(first.announcement);
    expect(getAssessmentGeneratingAnnouncement(2)).toBe(last.announcement);
    expect(getAssessmentGeneratingAnnouncement(-5)).toBe(first.announcement);
  });

  it("el título y la descripción del diálogo son no vacíos", () => {
    expect(ASSESSMENT_GENERATING_TITLE.trim()).not.toBe("");
    expect(ASSESSMENT_GENERATING_DESCRIPTION.trim()).not.toBe("");
  });
});

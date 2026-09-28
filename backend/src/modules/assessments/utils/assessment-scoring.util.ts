import { SkillCategory } from '../../../generated/prisma/enums.js';
import {
  CATEGORY_BY_TECH_STACK_OPTION,
  GOAL_BY_OPTION_ORDER,
  SCORE_MULTIPLIER,
  TECH_STACK_BY_OPTION_ORDER,
  WEEKLY_HOURS_BY_OPTION_ORDER,
} from '../constants/assessment.constants.js';
import type {
  CalculatedProfile,
  ValidatedAnswer,
} from '../types/assessment.types.js';

/**
 * Calcula de forma pura el perfil de habilidades del usuario y su objetivo principal
 * a partir de las respuestas validadas del cuestionario.
 */
export function calculateProfile(
  validatedAnswers: ValidatedAnswer[],
): CalculatedProfile {
  const profileScores: Record<SkillCategory, number> = {
    [SkillCategory.BACKEND]: 0,
    [SkillCategory.FRONTEND]: 0,
    [SkillCategory.DEVOPS]: 0,
    [SkillCategory.DATABASES]: 0,
    [SkillCategory.MOBILE]: 0,
    [SkillCategory.TESTING]: 0,
    [SkillCategory.WEB_FUNDAMENTALS]: 0,
  };

  let goalCategory: SkillCategory = SkillCategory.WEB_FUNDAMENTALS;
  let preferredStack: string | undefined;
  let weeklyHours: number | undefined;

  for (const ans of validatedAnswers) {
    if (ans.isGoalQuestion) {
      goalCategory =
        GOAL_BY_OPTION_ORDER[ans.optionOrder] ?? SkillCategory.WEB_FUNDAMENTALS;
    }

    if (ans.isTechStackQuestion) {
      preferredStack = TECH_STACK_BY_OPTION_ORDER[ans.optionOrder];
      const stackCategory = CATEGORY_BY_TECH_STACK_OPTION[ans.optionOrder];
      if (stackCategory) {
        goalCategory = stackCategory;
      }
    }

    if (ans.isTimeQuestion) {
      weeklyHours = WEEKLY_HOURS_BY_OPTION_ORDER[ans.optionOrder];
    }

    const points = ans.optionValue * SCORE_MULTIPLIER;

    // Pregunta de DevOps / Testing: la opción 3 (Testing) aporta a la dimensión TESTING
    if (
      ans.questionCategory === SkillCategory.DEVOPS &&
      ans.optionOrder === 3
    ) {
      profileScores[SkillCategory.TESTING] += points;
    } else {
      profileScores[ans.questionCategory] += points;
    }
  }

  return { goalCategory, profileScores, preferredStack, weeklyHours };
}

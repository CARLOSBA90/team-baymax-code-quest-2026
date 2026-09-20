import { SkillCategory } from '../../../generated/prisma/enums.js';
import type { ValidatedAnswer } from '../types/assessment.types.js';
import { calculateProfile } from './assessment-scoring.util.js';

describe('calculateProfile', () => {
  it('assigns goalCategory and scores based on validated answers', () => {
    const answers: ValidatedAnswer[] = [
      {
        questionId: 'q-1',
        optionId: 'opt-backend',
        optionValue: 5,
        questionCategory: SkillCategory.WEB_FUNDAMENTALS,
        isGoalQuestion: true,
        optionOrder: 2, // 2 -> BACKEND
      },
      {
        questionId: 'q-2',
        optionId: 'opt-lvl-4',
        optionValue: 4, // 4 * 5 = 20
        questionCategory: SkillCategory.BACKEND,
        isGoalQuestion: false,
        optionOrder: 4,
      },
      {
        questionId: 'q-3',
        optionId: 'opt-fe-2',
        optionValue: 2, // 2 * 5 = 10
        questionCategory: SkillCategory.FRONTEND,
        isGoalQuestion: false,
        optionOrder: 2,
      },
    ];

    const result = calculateProfile(answers);

    expect(result.goalCategory).toBe(SkillCategory.BACKEND);
    expect(result.profileScores.BACKEND).toBe(20);
    expect(result.profileScores.FRONTEND).toBe(10);
    expect(result.profileScores.DEVOPS).toBe(0);
  });

  it('allocates points to TESTING when option 3 of DEVOPS is answered', () => {
    const answers: ValidatedAnswer[] = [
      {
        questionId: 'q-1',
        optionId: 'opt-fe',
        optionValue: 5,
        questionCategory: SkillCategory.WEB_FUNDAMENTALS,
        isGoalQuestion: true,
        optionOrder: 1, // 1 -> FRONTEND
      },
      {
        questionId: 'q-6',
        optionId: 'opt-testing',
        optionValue: 3, // 3 * 5 = 15 points to TESTING
        questionCategory: SkillCategory.DEVOPS,
        isGoalQuestion: false,
        optionOrder: 3,
      },
    ];

    const result = calculateProfile(answers);

    expect(result.goalCategory).toBe(SkillCategory.FRONTEND);
    expect(result.profileScores.TESTING).toBe(15);
    expect(result.profileScores.DEVOPS).toBe(0);
  });
});

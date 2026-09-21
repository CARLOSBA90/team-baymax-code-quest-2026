import { Test, TestingModule } from '@nestjs/testing';
import { SkillCategory } from '../../generated/prisma/enums.js';
import type { Session } from '../auth/auth.js';
import { AssessmentsController } from './assessments.controller.js';
import { AssessmentsService } from './assessments.service.js';

describe('AssessmentsController', () => {
  let controller: AssessmentsController;
  let assessmentsService: {
    getQuestions: ReturnType<typeof vi.fn>;
    submit: ReturnType<typeof vi.fn>;
    getMyResult: ReturnType<typeof vi.fn>;
  };

  const createSession = (userId = 'user-1'): Session =>
    ({
      user: {
        id: userId,
        name: 'Baymax',
        email: 'baymax@example.com',
        emailVerified: true,
        image: null,
        createdAt: new Date('2026-09-18T00:00:00.000Z'),
        updatedAt: new Date('2026-09-19T00:00:00.000Z'),
      },
    }) as Session;

  beforeEach(async () => {
    assessmentsService = {
      getQuestions: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'q-1',
            text: '¿Cuál es tu objetivo?',
            category: SkillCategory.WEB_FUNDAMENTALS,
            order: 1,
            options: [{ id: 'opt-1', text: 'Backend', order: 1 }],
          },
        ],
      }),
      submit: vi.fn().mockResolvedValue({
        data: {
          id: 'assm-1',
          userId: 'user-1',
          version: 1,
          goalCategory: SkillCategory.BACKEND,
          profileScores: { BACKEND: 20 },
          completedAt: new Date('2026-09-20T00:00:00.000Z'),
          createdAt: new Date('2026-09-20T00:00:00.000Z'),
        },
      }),
      getMyResult: vi.fn().mockResolvedValue({
        data: {
          id: 'assm-1',
          userId: 'user-1',
          version: 1,
          goalCategory: SkillCategory.BACKEND,
          profileScores: { BACKEND: 20 },
          completedAt: new Date('2026-09-20T00:00:00.000Z'),
          createdAt: new Date('2026-09-20T00:00:00.000Z'),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [
        { provide: AssessmentsService, useValue: assessmentsService },
      ],
    }).compile();

    controller = module.get(AssessmentsController);
  });

  it('delegates to AssessmentsService.getQuestions and returns the list', async () => {
    const response = await controller.getQuestions();

    expect(assessmentsService.getQuestions).toHaveBeenCalledOnce();
    expect(response).toEqual({
      data: [
        {
          id: 'q-1',
          text: '¿Cuál es tu objetivo?',
          category: SkillCategory.WEB_FUNDAMENTALS,
          order: 1,
          options: [{ id: 'opt-1', text: 'Backend', order: 1 }],
        },
      ],
    });
  });

  it('delegates to AssessmentsService.submit with session user id and answers', async () => {
    const session = createSession('user-1');
    const dto = {
      answers: [{ questionId: 'q-1', optionId: 'opt-1' }],
    };

    const response = await controller.submit(session, dto);

    expect(assessmentsService.submit).toHaveBeenCalledExactlyOnceWith(
      'user-1',
      dto,
    );
    expect(response.data.id).toBe('assm-1');
    expect(response.data.goalCategory).toBe(SkillCategory.BACKEND);
  });

  it('delegates to AssessmentsService.getMyResult with session user id', async () => {
    const session = createSession('user-1');

    const response = await controller.getMyResult(session);

    expect(assessmentsService.getMyResult).toHaveBeenCalledExactlyOnceWith(
      'user-1',
    );
    expect(response.data.userId).toBe('user-1');
  });
});

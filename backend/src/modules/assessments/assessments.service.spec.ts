import { UnauthorizedException } from '@nestjs/common';
import { SkillCategory } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { RoadmapGenerationService } from '../roadmaps/roadmap-generation.service.js';
import { AssessmentsService } from './assessments.service.js';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let prismaMock: {
    question: { findMany: ReturnType<typeof vi.fn> };
    assessment: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    roadmap: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  let roadmapGenerationMock: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prismaMock = {
      question: {
        findMany: vi.fn(),
      },
      assessment: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      roadmap: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    roadmapGenerationMock = {
      generate: vi.fn().mockResolvedValue({ data: { id: 'roadmap-gen-1' } }),
    };
    service = new AssessmentsService(
      prismaMock as unknown as PrismaService,
      roadmapGenerationMock as unknown as RoadmapGenerationService,
    );
  });

  describe('getQuestions', () => {
    it('queries active questions ordered by order ascending with clean selection', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          text: '¿Cuál es tu principal objetivo profesional?',
          category: SkillCategory.WEB_FUNDAMENTALS,
          order: 1,
          options: [
            { id: 'opt-1', text: 'Backend', order: 1 },
            { id: 'opt-2', text: 'Frontend', order: 2 },
          ],
        },
      ];

      prismaMock.question.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getQuestions();

      expect(prismaMock.question.findMany).toHaveBeenCalledExactlyOnceWith({
        where: { active: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          text: true,
          category: true,
          order: true,
          options: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              text: true,
              order: true,
            },
          },
        },
      });

      expect(result).toEqual({ data: mockQuestions });
    });

    it('ensures no scoring values or internal flags are returned in options', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          text: 'Pregunta de prueba',
          category: SkillCategory.BACKEND,
          order: 1,
          options: [{ id: 'opt-1', text: 'Opción 1', order: 1 }],
        },
      ];

      prismaMock.question.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getQuestions();

      const firstOption = result.data[0].options[0];
      expect(firstOption).not.toHaveProperty('value');
      expect(firstOption).not.toHaveProperty('questionId');
      expect(result.data[0]).not.toHaveProperty('active');
    });
  });

  describe('submit', () => {
    const mockActiveQuestions = [
      {
        id: 'q-1',
        order: 1,
        category: SkillCategory.WEB_FUNDAMENTALS,
        options: [
          { id: 'opt-1-front', order: 1, value: 5, text: 'Frontend UI' },
          { id: 'opt-1-back', order: 2, value: 5, text: 'Backend APIs' },
        ],
      },
      {
        id: 'q-2',
        order: 2,
        category: SkillCategory.BACKEND,
        options: [
          { id: 'opt-2-lvl1', order: 1, value: 1, text: 'Nivel 1' },
          { id: 'opt-2-lvl4', order: 4, value: 4, text: 'Nivel 4' },
        ],
      },
    ];

    it('throws UnauthorizedException if userId is missing', async () => {
      await expect(
        service.submit(undefined, { answers: [] }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException if answers are empty or invalid', async () => {
      await expect(
        service.submit('user-1', { answers: [] }),
      ).rejects.toThrow('El listado de respuestas es requerido y no puede estar vacío');
    });

    it('throws BadRequestException if no active questions exist in database', async () => {
      prismaMock.question.findMany.mockResolvedValue([]);

      await expect(
        service.submit('user-1', {
          answers: [{ questionId: 'q-1', optionId: 'opt-1' }],
        }),
      ).rejects.toThrow('No se encontraron preguntas activas para completar la evaluación');
    });

    it('throws BadRequestException if a question is answered more than once', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      await expect(
        service.submit('user-1', {
          answers: [
            { questionId: 'q-1', optionId: 'opt-1-front' },
            { questionId: 'q-1', optionId: 'opt-1-back' },
          ],
        }),
      ).rejects.toThrow('Se envió una respuesta duplicada para la pregunta con id q-1');
    });

    it('throws BadRequestException if option does not belong to the question', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      await expect(
        service.submit('user-1', {
          answers: [
            { questionId: 'q-1', optionId: 'opt-2-lvl1' },
            { questionId: 'q-2', optionId: 'opt-2-lvl4' },
          ],
        }),
      ).rejects.toThrow('La opción con id opt-2-lvl1 no es válida para la pregunta q-1');
    });

    it('throws BadRequestException if any active question is missing an answer', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      await expect(
        service.submit('user-1', {
          answers: [{ questionId: 'q-1', optionId: 'opt-1-front' }],
        }),
      ).rejects.toThrow('Falta responder la pregunta número 2');
    });

    it('computes goalCategory and profileScores correctly and creates Assessment', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      const mockSavedAssessment = {
        id: 'assm-1',
        userId: 'user-1',
        version: 1,
        goalCategory: SkillCategory.BACKEND,
        profileScores: {
          BACKEND: 20,
          FRONTEND: 0,
          DEVOPS: 0,
          DATABASES: 0,
          MOBILE: 0,
          TESTING: 0,
          WEB_FUNDAMENTALS: 0,
        },
        completedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
      };

      prismaMock.assessment.create.mockResolvedValue(mockSavedAssessment);

      const result = await service.submit('user-1', {
        answers: [
          { questionId: 'q-1', optionId: 'opt-1-back' }, // order 2 -> BACKEND
          { questionId: 'q-2', optionId: 'opt-2-lvl4' }, // value 4 -> 4 * 5 = 20 BACKEND
        ],
      });

      expect(prismaMock.assessment.create).toHaveBeenCalledOnce();
      const createCall = prismaMock.assessment.create.mock.calls[0][0];

      expect(createCall.data.userId).toBe('user-1');
      expect(createCall.data.goalCategory).toBe(SkillCategory.BACKEND);
      expect(createCall.data.profileScores).toMatchObject({
        BACKEND: 20,
      });
      expect(result).toEqual({
        data: {
          ...mockSavedAssessment,
          roadmap: {
            status: 'GENERATED',
            id: 'roadmap-gen-1',
          },
        },
      });
    });

    it('calls roadmapGenerationService.generate once with the persisted assessmentId', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      const mockSavedAssessment = {
        id: 'assm-1',
        userId: 'user-1',
        version: 1,
        goalCategory: SkillCategory.BACKEND,
        profileScores: { BACKEND: 20 },
        completedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
      };
      prismaMock.assessment.create.mockResolvedValue(mockSavedAssessment);

      const result = await service.submit('user-1', {
        answers: [
          { questionId: 'q-1', optionId: 'opt-1-back' },
          { questionId: 'q-2', optionId: 'opt-2-lvl4' },
        ],
      });

      expect(roadmapGenerationMock.generate).toHaveBeenCalledExactlyOnceWith(
        'user-1',
        { assessmentId: 'assm-1' },
      );
      expect(result.data.roadmap).toEqual({
        status: 'GENERATED',
        id: 'roadmap-gen-1',
      });
    });

    it('does not throw and indicates FAILED status when roadmap generation fails', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      const mockSavedAssessment = {
        id: 'assm-1',
        userId: 'user-1',
        version: 1,
        goalCategory: SkillCategory.BACKEND,
        profileScores: { BACKEND: 20 },
        completedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
      };
      prismaMock.assessment.create.mockResolvedValue(mockSavedAssessment);
      roadmapGenerationMock.generate.mockRejectedValue(
        new Error('Catalog is empty — no courses available'),
      );

      const result = await service.submit('user-1', {
        answers: [
          { questionId: 'q-1', optionId: 'opt-1-back' },
          { questionId: 'q-2', optionId: 'opt-2-lvl4' },
        ],
      });

      // El submit no explota: el assessment fue persistido y se retorna con status FAILED
      expect(result).toEqual({
        data: {
          ...mockSavedAssessment,
          roadmap: {
            status: 'FAILED',
            message: 'Catalog is empty — no courses available',
          },
        },
      });
    });

    it('returns roadmap with status EXISTS if a roadmap already exists for the assessment', async () => {
      prismaMock.question.findMany.mockResolvedValue(mockActiveQuestions);

      const mockSavedAssessment = {
        id: 'assm-1',
        userId: 'user-1',
        version: 1,
        goalCategory: SkillCategory.BACKEND,
        profileScores: { BACKEND: 20 },
        completedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
      };
      prismaMock.assessment.create.mockResolvedValue(mockSavedAssessment);
      prismaMock.roadmap.findFirst.mockResolvedValue({ id: 'roadmap-existing-99' });

      const result = await service.submit('user-1', {
        answers: [
          { questionId: 'q-1', optionId: 'opt-1-back' },
          { questionId: 'q-2', optionId: 'opt-2-lvl4' },
        ],
      });

      expect(roadmapGenerationMock.generate).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: {
          ...mockSavedAssessment,
          roadmap: {
            status: 'EXISTS',
            id: 'roadmap-existing-99',
          },
        },
      });
    });
  });

  describe('getMyResult', () => {
    it('throws UnauthorizedException if userId is missing', async () => {
      await expect(service.getMyResult(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the latest completed assessment for the user', async () => {
      const mockAssessment = {
        id: 'assm-1',
        userId: 'user-1',
        version: 1,
        goalCategory: SkillCategory.BACKEND,
        profileScores: { BACKEND: 20 },
        completedAt: new Date('2026-09-20T00:00:00.000Z'),
        createdAt: new Date('2026-09-20T00:00:00.000Z'),
      };

      prismaMock.assessment.findFirst.mockResolvedValue(mockAssessment);

      const result = await service.getMyResult('user-1');

      expect(prismaMock.assessment.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', completedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          version: true,
          goalCategory: true,
          profileScores: true,
          completedAt: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({ data: mockAssessment });
    });

    it('throws NotFoundException when user has no completed assessment', async () => {
      prismaMock.assessment.findFirst.mockResolvedValue(null);

      await expect(service.getMyResult('user-1')).rejects.toThrow(
        'No se encontró ninguna evaluación completada para este usuario',
      );
    });
  });
});

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RoadmapGenerationService } from '../roadmaps/roadmap-generation.service.js';
import type { QuestionsListResponseDto } from './dto/question-response.dto.js';
import type {
  AssessmentResultDto,
  AssessmentResultResponseDto,
  SubmitAssessmentDto,
} from './dto/submit-assessment.dto.js';
import type {
  CalculatedProfile,
  ValidatedAnswer,
} from './types/assessment.types.js';
import { calculateProfile } from './utils/assessment-scoring.util.js';
import { AssessmentValidator } from './validators/assessment.validator.js';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roadmapGenerationService: RoadmapGenerationService,
  ) {}

  /**
   * Obtiene la lista completa de preguntas activas con sus opciones para el cuestionario. 
   */
  async getQuestions(): Promise<QuestionsListResponseDto> {
    const questions = await this.prisma.question.findMany({
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

    return { data: questions };
  }

  /**
   * Procesa y persiste las respuestas de un cuestionario completado. 
   */
  async submit(
    userId: string | undefined,
    dto: SubmitAssessmentDto,
  ): Promise<AssessmentResultResponseDto> {
    AssessmentValidator.assertActiveSession(userId);
    AssessmentValidator.validatePayload(dto);

    const activeQuestions = await this.prisma.question.findMany({
      where: { active: true },
      include: { options: true },
    });

    if (activeQuestions.length === 0) {
      throw new BadRequestException(
        'No se encontraron preguntas activas para completar la evaluación',
      );
    }

    const validatedAnswers = AssessmentValidator.validateAndExtractAnswers(
      activeQuestions,
      dto.answers,
    );

    const profile = calculateProfile(validatedAnswers);

    const assessment = await this.persistAssessment(
      userId,
      profile,
      validatedAnswers,
    );

    try {
      await this.roadmapGenerationService.generate(userId, {
        assessmentId: assessment.id,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo auto-generar la ruta para el assessment ${assessment.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { data: assessment };
  }

  /**
   * Retorna la última evaluación completada por el usuario autenticado.
   */
  async getMyResult(
    userId: string | undefined,
  ): Promise<AssessmentResultResponseDto> {
    AssessmentValidator.assertActiveSession(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        userId,
        completedAt: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

    if (!assessment) {
      throw new NotFoundException(
        'No se encontró ninguna evaluación completada para este usuario',
      );
    }

    return {
      data: {
        ...assessment,
        profileScores: assessment.profileScores as Record<string, number> | null,
      },
    };
  }

  /**
   * Persiste la entidad Assessment y sus AssessmentAnswer asociadas en PostgreSQL.
   */
  private async persistAssessment(
    userId: string,
    profile: CalculatedProfile,
    validatedAnswers: ValidatedAnswer[],
  ): Promise<AssessmentResultDto> {
    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        version: 1,
        completedAt: new Date(),
        goalCategory: profile.goalCategory,
        profileScores: profile.profileScores,
        answers: {
          create: validatedAnswers.map((ans) => ({
            questionId: ans.questionId,
            optionId: ans.optionId,
            numericValue: ans.optionValue,
          })),
        },
      },
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

    return {
      ...assessment,
      profileScores: assessment.profileScores as Record<string, number> | null,
    };
  }
}

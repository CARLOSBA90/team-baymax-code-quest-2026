import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type {
  AssessmentAnswerInputDto,
  SubmitAssessmentDto,
} from '../dto/submit-assessment.dto.js';
import type {
  QuestionWithOptions,
  ValidatedAnswer,
} from '../types/assessment.types.js';

export class AssessmentValidator {
  /**
   * Garantiza que exista un usuario en sesión para operaciones protegidas.
   */
  static assertActiveSession(
    userId: string | undefined,
  ): asserts userId is string {
    if (!userId) {
      throw new UnauthorizedException(
        'Se requiere una sesión activa para realizar esta acción',
      );
    }
  }

  /**
   * Valida la estructura básica del payload recibido.
   */
  static validatePayload(dto: SubmitAssessmentDto): void {
    if (
      !dto?.answers ||
      !Array.isArray(dto.answers) ||
      dto.answers.length === 0
    ) {
      throw new BadRequestException(
        'El listado de respuestas es requerido y no puede estar vacío',
      );
    }
  }

  /**
   * Valida la integridad referencial de las respuestas contra las preguntas y opciones de la BD,
   * garantizando que no haya duplicados y que todas las preguntas activas sean respondidas.
   */
  static validateAndExtractAnswers(
    activeQuestions: QuestionWithOptions[],
    answers: AssessmentAnswerInputDto[],
  ): ValidatedAnswer[] {
    const questionMap = new Map(activeQuestions.map((q) => [q.id, q]));
    const answeredQuestionIds = new Set<string>();
    const validatedAnswers: ValidatedAnswer[] = [];

    for (const ans of answers) {
      if (!ans.questionId || !ans.optionId) {
        throw new BadRequestException(
          'Cada respuesta debe incluir questionId y optionId',
        );
      }

      if (answeredQuestionIds.has(ans.questionId)) {
        throw new BadRequestException(
          `Se envió una respuesta duplicada para la pregunta con id ${ans.questionId}`,
        );
      }
      answeredQuestionIds.add(ans.questionId);

      const question = questionMap.get(ans.questionId);
      if (!question) {
        throw new BadRequestException(
          `La pregunta con id ${ans.questionId} no existe o no está activa`,
        );
      }

      const option = question.options.find((opt) => opt.id === ans.optionId);
      if (!option) {
        throw new BadRequestException(
          `La opción con id ${ans.optionId} no es válida para la pregunta ${ans.questionId}`,
        );
      }

      validatedAnswers.push({
        questionId: question.id,
        optionId: option.id,
        optionValue: option.value,
        questionCategory: question.category,
        isGoalQuestion: question.order === 1,
        optionOrder: option.order,
      });
    }

    for (const q of activeQuestions) {
      if (!answeredQuestionIds.has(q.id)) {
        throw new BadRequestException(
          `Falta responder la pregunta número ${q.order}`,
        );
      }
    }

    return validatedAnswers;
  }
}

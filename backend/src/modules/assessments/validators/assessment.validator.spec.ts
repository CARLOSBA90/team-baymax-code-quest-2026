import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import type { QuestionWithOptions } from '../types/assessment.types.js';
import { AssessmentValidator } from './assessment.validator.js';

describe('AssessmentValidator', () => {
  describe('assertActiveSession', () => {
    it('throws UnauthorizedException when userId is undefined or empty', () => {
      expect(() => AssessmentValidator.assertActiveSession(undefined)).toThrow(
        UnauthorizedException,
      );
      expect(() => AssessmentValidator.assertActiveSession('')).toThrow(
        UnauthorizedException,
      );
    });

    it('passes when a valid userId is provided', () => {
      expect(() =>
        AssessmentValidator.assertActiveSession('user-123'),
      ).not.toThrow();
    });
  });

  describe('validatePayload', () => {
    it('throws BadRequestException if answers array is missing or empty', () => {
      expect(() =>
        AssessmentValidator.validatePayload({ answers: [] }),
      ).toThrow(BadRequestException);
      expect(() =>
        AssessmentValidator.validatePayload({ answers: null as unknown as [] }),
      ).toThrow(BadRequestException);
    });

    it('passes when valid answers array is provided', () => {
      expect(() =>
        AssessmentValidator.validatePayload({
          answers: [{ questionId: 'q-1', optionId: 'opt-1' }],
        }),
      ).not.toThrow();
    });
  });

  describe('validateAndExtractAnswers', () => {
    const mockQuestions: QuestionWithOptions[] = [
      {
        id: 'q-1',
        order: 1,
        category: SkillCategory.WEB_FUNDAMENTALS,
        options: [
          { id: 'opt-1', order: 1, value: 5 },
          { id: 'opt-2', order: 2, value: 5 },
        ],
      },
      {
        id: 'q-2',
        order: 2,
        category: SkillCategory.BACKEND,
        options: [{ id: 'opt-3', order: 1, value: 3 }],
      },
    ];

    it('throws BadRequestException if questionId or optionId is missing in any answer', () => {
      expect(() =>
        AssessmentValidator.validateAndExtractAnswers(mockQuestions, [
          { questionId: 'q-1', optionId: '' },
        ]),
      ).toThrow('Cada respuesta debe incluir questionId y optionId');
    });

    it('throws BadRequestException if duplicate answers are passed for a question', () => {
      expect(() =>
        AssessmentValidator.validateAndExtractAnswers(mockQuestions, [
          { questionId: 'q-1', optionId: 'opt-1' },
          { questionId: 'q-1', optionId: 'opt-2' },
        ]),
      ).toThrow('Se envió una respuesta duplicada para la pregunta con id q-1');
    });

    it('throws BadRequestException if question does not exist or is inactive', () => {
      expect(() =>
        AssessmentValidator.validateAndExtractAnswers(mockQuestions, [
          { questionId: 'q-unknown', optionId: 'opt-1' },
        ]),
      ).toThrow('La pregunta con id q-unknown no existe o no está activa');
    });

    it('throws BadRequestException if option does not belong to question', () => {
      expect(() =>
        AssessmentValidator.validateAndExtractAnswers(mockQuestions, [
          { questionId: 'q-1', optionId: 'opt-3' },
          { questionId: 'q-2', optionId: 'opt-3' },
        ]),
      ).toThrow('La opción con id opt-3 no es válida para la pregunta q-1');
    });

    it('throws BadRequestException if any active question is omitted', () => {
      expect(() =>
        AssessmentValidator.validateAndExtractAnswers(mockQuestions, [
          { questionId: 'q-1', optionId: 'opt-1' },
        ]),
      ).toThrow('Falta responder la pregunta número 2');
    });

    it('returns extracted answers when all validations pass', () => {
      const extracted = AssessmentValidator.validateAndExtractAnswers(
        mockQuestions,
        [
          { questionId: 'q-1', optionId: 'opt-1' },
          { questionId: 'q-2', optionId: 'opt-3' },
        ],
      );

      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toMatchObject({
        questionId: 'q-1',
        optionId: 'opt-1',
        optionValue: 5,
        isGoalQuestion: true,
      });
      expect(extracted[1]).toMatchObject({
        questionId: 'q-2',
        optionId: 'opt-3',
        optionValue: 3,
        isGoalQuestion: false,
      });
    });
  });
});

import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import type { Session as UserSession } from '../auth/auth.js';
import { AssessmentsService } from './assessments.service.js';
import type { QuestionsListResponseDto } from './dto/question-response.dto.js';
import type {
  AssessmentResultResponseDto,
  SubmitAssessmentDto,
} from './dto/submit-assessment.dto.js';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) { }

  /**
   * GET /api/v1/assessments/questions
   * Retorna el catálogo completo de preguntas activas para el cuestionario de diagnóstico.
   */
  @Get('questions')
  @Header('Cache-Control', 'private, max-age=60')
  getQuestions(): Promise<QuestionsListResponseDto> {
    return this.assessmentsService.getQuestions();
  }

  /**
   * POST /api/v1/assessments/submit
   * Envía las respuestas del cuestionario del usuario. 
   */
  @Post('submit')
  submit(
    @Session() session: UserSession,
    @Body() dto: SubmitAssessmentDto,
  ): Promise<AssessmentResultResponseDto> {
    return this.assessmentsService.submit(session?.user?.id, dto);
  }

  /**
   * GET /api/v1/assessments/my-result
   * Retorna la última evaluación completada por el usuario en sesión. 
   */
  @Get('my-result')
  getMyResult(
    @Session() session: UserSession,
  ): Promise<AssessmentResultResponseDto> {
    return this.assessmentsService.getMyResult(session?.user?.id);
  }
}

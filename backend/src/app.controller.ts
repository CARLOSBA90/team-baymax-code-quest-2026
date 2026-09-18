import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /api/health
   * Público: queda fuera del guard global de AuthModule.
   */
  @Get('health')
  @AllowAnonymous()
  getHealth() {
    return this.appService.getHealth();
  }
}

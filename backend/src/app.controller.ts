import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api/v1/health. Público, queda fuera del guard global. */
  @Get('health')
  @AllowAnonymous()
  getHealth() {
    return this.appService.getHealth();
  }
}

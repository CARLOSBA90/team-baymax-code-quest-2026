import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { registerMailService } from '../auth/auth.js';
import { MailService } from './mail.service.js';

/**
 * Puente entre el contenedor de inyeccion de Nest y la configuracion standalone
 * de Better Auth (auth.ts), que vive fuera del ciclo de vida del DI container.
 *
 * En onModuleInit registra la referencia al MailService para que el hook
 * sendResetPassword de Better Auth pueda enviar emails.
 */
@Injectable()
export class MailBridgeService implements OnModuleInit {
  private readonly logger = new Logger(MailBridgeService.name);

  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    registerMailService(this.mailService);
    this.logger.log('MailService registrado en Better Auth');
  }
}

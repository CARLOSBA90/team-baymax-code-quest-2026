import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailBridgeService } from './mail-bridge.service.js';
import { MailService } from './mail.service.js';

/**
 * Modulo global de email via SMTP (compatible con Brevo, Gmail, etc.).
 * Al ser @Global(), solo necesita importarse en AppModule y queda disponible
 * en todos los modulos sin re-importarlo.
 */
@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>('MAIL_HOST');
        const port = config.get<number>('MAIL_PORT', 587);
        const rawUser = config.getOrThrow<string>('MAIL_USER').trim();
        const user = rawUser.replace(/^["']+|["']+$/g, '');
        const pass = config.getOrThrow<string>('MAIL_PASSWORD').trim();
        // Puerto 465 requiere TLS directo; 587 usa STARTTLS
        const secure = port === 465;

        // Fallback a MAIL_USER si MAIL_SENDER_EMAIL no está definido o está vacío
        const rawSenderEmail = (
          config.get<string>('MAIL_SENDER_EMAIL')?.trim() || user
        ).replace(/^["'<]+|["'>]+$/g, '').trim();

        const rawSenderName = (
          config.get<string>('MAIL_SENDER_NAME', 'CodeQuest')?.trim() || 'CodeQuest'
        ).replace(/^["']+|["']+$/g, '').trim();

        return {
          transport: {
            host,
            port,
            secure,
            auth: { user, pass },
            tls: {
              // Permite certificados autofirmados en desarrollo.
              // En produccion Brevo usa certificados validos.
              rejectUnauthorized: config.get('NODE_ENV') === 'production',
            },
          },
          defaults: {
            from: {
              name: rawSenderName,
              address: rawSenderEmail,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService, MailBridgeService],
  exports: [MailService],
})
export class MailModule {}

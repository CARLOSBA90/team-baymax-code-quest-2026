import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    this.senderName = this.config.get<string>('MAIL_SENDER_NAME', 'CodeQuest');
    this.senderEmail = this.config.getOrThrow<string>('MAIL_SENDER_EMAIL');
  }

  /**
   * Envía el email de recuperación de contraseña.
   * La URL con el token es generada por Better Auth y se recibe ya armada.
   *
   * @param to      Email del destinatario
   * @param name    Nombre del usuario (para personalizar el saludo)
   * @param url     URL completa de reset generada por Better Auth
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<void> {
    this.logger.log(`Enviando email de recuperacion de contrasena a: ${to}`);

    await this.mailer.sendMail({
      to,
      from: `"${this.senderName}" <${this.senderEmail}>`,
      subject: 'Restablecer tu contraseña — CodeQuest',
      html: this.buildPasswordResetHtml(name, url),
    });

    this.logger.log(`Email de recuperacion enviado exitosamente a: ${to}`);
  }

  // ─── Templates HTML inline ────────────────────────────────────────────────
  // Se usa HTML inline (sin Handlebars) para evitar la complejidad de copiar
  // assets a dist/ en un proyecto ESM con nest-cli.

  private buildPasswordResetHtml(name: string, resetUrl: string): string {
    const displayName = name || 'Usuario';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
         style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background-color:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
                       padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">
                Restablecer Contraseña
              </h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px;">
                Hola <strong>${displayName}</strong>,
              </p>
              <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en CodeQuest.
                Hacé clic en el botón de abajo para crear una nueva contraseña:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0"
                     style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:8px;
                             background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;
                              text-decoration:none;font-size:15px;font-weight:600;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#888888;font-size:13px;line-height:1.6;margin:0 0 12px;">
                Este enlace expira en <strong>1 hora</strong>.
              </p>
              <p style="color:#888888;font-size:13px;line-height:1.6;margin:0;">
                Si no solicitaste este cambio, podés ignorar este correo de forma segura.
                Tu contraseña actual no será modificada.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background-color:#f8f9fa;padding:24px 30px;text-align:center;
                       border-top:1px solid #e9ecef;">
              <p style="color:#999999;font-size:12px;margin:0;">
                Este correo fue enviado automáticamente. Por favor, no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

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
    this.frontendUrl = this.resolveFrontendUrl();
    const user = (this.config.get<string>('MAIL_USER') ?? '').trim().replace(/^["']+|["']+$/g, '');
    const rawSenderEmail = (
      this.config.get<string>('MAIL_SENDER_EMAIL')?.trim() || user
    ).replace(/^["'<]+|["'>]+$/g, '').trim();

    this.senderEmail = rawSenderEmail;
    this.senderName = (
      this.config.get<string>('MAIL_SENDER_NAME', 'CodeQuest')?.trim() || 'CodeQuest'
    ).replace(/^["']+|["']+$/g, '').trim();
  }

  /**
   * Determina la URL base del frontend.
   * En producción (NODE_ENV === 'production') apunta a https://cepr0.com/codequest.
   * En desarrollo apunta a http://localhost:5173.
   * Puede sobreescribirse explícitamente con la variable de entorno FRONTEND_URL.
   */
  private resolveFrontendUrl(): string {
    const rawConfigUrl = this.config.get<string>('FRONTEND_URL');
    const isProd =
      this.config.get<string>('NODE_ENV') === 'production' ||
      process.env.NODE_ENV === 'production';

    if (rawConfigUrl && rawConfigUrl.trim()) {
      let url = rawConfigUrl.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return url.replace(/\/+$/, '');
    }

    return isProd ? 'https://cepr0.com/codequest' : 'http://localhost:5173';
  }

  /** Retorna la URL base del frontend resuelta. */
  getFrontendUrl(): string {
    return this.frontendUrl;
  }

  /**
   * Resuelve y asegura que la URL de reseteo apunte a la aplicación frontend
   * (en producción https://cepr0.com/codequest, en dev http://localhost:5173).
   *
   * Si la URL viene de Better Auth con otro host (ej. host del backend o localhost:3001),
   * extrae el token / parámetros y la ruta, y la monta sobre el frontendUrl configurado.
   */
  resolveResetUrl(rawUrl: string): string {
    const base = this.frontendUrl;

    try {
      const parsed = new URL(rawUrl);
      const baseParsed = new URL(base);

      const search = parsed.search; // Preserva ?token=... y demás query params
      let resetPath = parsed.pathname;

      // Normaliza si Better Auth incluyera el prefijo del backend
      if (resetPath.startsWith('/api/auth/')) {
        resetPath = resetPath.replace('/api/auth/', '/auth/');
      }

      // Si baseParsed tiene sub-ruta (como /codequest en cepr0.com/codequest)
      const baseSubPath = baseParsed.pathname.replace(/\/+$/, '');
      if (baseSubPath && !resetPath.startsWith(baseSubPath)) {
        resetPath = `${baseSubPath}${resetPath.startsWith('/') ? '' : '/'}${resetPath}`;
      }

      return `${baseParsed.origin}${resetPath}${search}`;
    } catch {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      return `${cleanBase}${cleanPath}`;
    }
  }

  /**
   * Envía el email de recuperación de contraseña.
   * La URL con el token es generada por Better Auth y se normaliza para asegurar
   * que apunte al frontend (en producción https://cepr0.com/codequest).
   *
   * @param to      Email del destinatario
   * @param name    Nombre del usuario (para personalizar el saludo)
   * @param url     URL de reset (Better Auth o manual)
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<void> {
    const cleanTo = to.replace(/^["'<]+|["'>]+$/g, '').trim();

    if (!this.senderEmail) {
      throw new Error(
        'No se ha configurado MAIL_SENDER_EMAIL ni MAIL_USER en .env. ' +
        'Configura una dirección de email válida verificada en Brevo.',
      );
    }

    const finalResetUrl = this.resolveResetUrl(url);

    this.logger.log(
      `Enviando email de recuperacion de contrasena de <${this.senderEmail}> a: <${cleanTo}> (URL: ${finalResetUrl})`,
    );

    try {
      await this.mailer.sendMail({
        to: cleanTo,
        from: {
          name: this.senderName,
          address: this.senderEmail,
        },
        envelope: {
          from: this.senderEmail,
          to: [cleanTo],
        },
        subject: 'Restablecer tu contraseña — CodeQuest',
        html: this.buildPasswordResetHtml(name, finalResetUrl),
      });

      this.logger.log(`Email de recuperacion enviado exitosamente a: ${cleanTo}`);
    } catch (error: any) {
      if (
        error?.response?.includes('Invalid from') ||
        error?.responseCode === 451
      ) {
        this.logger.error(
          `[Brevo SMTP 451 Invalid from] El remitente '${this.senderEmail}' no está autorizado en Brevo. ` +
          `Configura MAIL_SENDER_EMAIL en tu .env con el email exacto de tu cuenta de Brevo ` +
          `o agrega un remitente verificado en https://app.brevo.com/senders`,
        );
      }
      throw error;
    }
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

import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service.js';

describe('MailService URL resolution', () => {
  const mockMailer = {
    sendMail: vi.fn(),
  } as unknown as MailerService;

  it('usa http://localhost:5173 por defecto en desarrollo', () => {
    const config = {
      get: vi.fn((key: string, defaultVal?: unknown) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'FRONTEND_URL') return undefined;
        if (key === 'MAIL_USER') return 'test@brevo.com';
        if (key === 'MAIL_SENDER_NAME') return defaultVal;
        return undefined;
      }),
    } as unknown as ConfigService;

    const svc = new MailService(mockMailer, config);
    expect(svc.getFrontendUrl()).toBe('http://localhost:5173');

    const resetUrl = svc.resolveResetUrl('/auth/reset-password?token=123');
    expect(resetUrl).toBe('http://localhost:5173/auth/reset-password?token=123');
  });

  it('usa https://cepr0.com/codequest en producción por defecto', () => {
    const config = {
      get: vi.fn((key: string, defaultVal?: unknown) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'FRONTEND_URL') return undefined;
        if (key === 'MAIL_USER') return 'test@brevo.com';
        if (key === 'MAIL_SENDER_NAME') return defaultVal;
        return undefined;
      }),
    } as unknown as ConfigService;

    const svc = new MailService(mockMailer, config);
    expect(svc.getFrontendUrl()).toBe('https://cepr0.com/codequest');

    const resetUrl = svc.resolveResetUrl('/auth/reset-password?token=prod_token_abc');
    expect(resetUrl).toBe(
      'https://cepr0.com/codequest/auth/reset-password?token=prod_token_abc',
    );
  });

  it('normaliza FRONTEND_URL si viene configurado sin protocolo', () => {
    const config = {
      get: vi.fn((key: string, defaultVal?: unknown) => {
        if (key === 'FRONTEND_URL') return 'cepr0.com/codequest';
        if (key === 'MAIL_USER') return 'test@brevo.com';
        if (key === 'MAIL_SENDER_NAME') return defaultVal;
        return undefined;
      }),
    } as unknown as ConfigService;

    const svc = new MailService(mockMailer, config);
    expect(svc.getFrontendUrl()).toBe('https://cepr0.com/codequest');

    // Transforma una URL absoluta del backend a la URL del frontend de producción
    const resetUrl = svc.resolveResetUrl(
      'http://localhost:3001/auth/reset-password?token=token_xyz',
    );
    expect(resetUrl).toBe(
      'https://cepr0.com/codequest/auth/reset-password?token=token_xyz',
    );
  });
});

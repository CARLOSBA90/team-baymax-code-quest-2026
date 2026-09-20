import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware } from 'better-auth/api';
import { prisma } from '../../prisma/prisma.service.js';

const logger = new Logger('Auth');

/** Orígenes de TRUSTED_ORIGINS, compartidos con el CORS de Nest. */
export const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Devuelve las credenciales de un proveedor social solo si AMBAS variables
 * están definidas. Si falta alguna, avisa por log y no registra el proveedor.
 */
export function resolveSocialProvider(
  name: string,
  idVar: string,
  secretVar: string,
): { clientId: string; clientSecret: string } | undefined {
  const clientId = process.env[idVar];
  const clientSecret = process.env[secretVar];

  if (!clientId || !clientSecret) {
    logger.warn(
      `Proveedor social "${name}" deshabilitado: faltan ${idVar} y/o ${secretVar}`,
    );
    return undefined;
  }

  return { clientId, clientSecret };
}

const google = resolveSocialProvider(
  'google',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
);
const github = resolveSocialProvider(
  'github',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
);
const discord = resolveSocialProvider(
  'discord',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
);

const socialProviders = {
  ...(google && { google }),
  ...(github && { github }),
  ...(discord && { discord }),
};

/** Cabecera de desarrollo con la URL de verificación del sign-up. */
export const VERIFICATION_URL_HEADER = 'X-Verification-Url';
const VERIFICATION_URL_TTL_MS = 60_000;

/** true solo si EXPOSE_VERIFICATION_URL === 'true' y NODE_ENV === 'development'. */
export const isVerificationUrlExposed = (): boolean =>
  process.env.EXPOSE_VERIFICATION_URL === 'true' &&
  process.env.NODE_ENV === 'development';

const verificationUrls = new Map<string, { url: string; expires: number }>();

export function storeVerificationUrl(email: string, url: string): void {
  const now = Date.now();
  for (const [key, entry] of verificationUrls) {
    if (entry.expires <= now) verificationUrls.delete(key);
  }
  verificationUrls.set(email.toLowerCase(), {
    url,
    expires: now + VERIFICATION_URL_TTL_MS,
  });
}

/** Lee y elimina la URL guardada para el email; undefined si no existe o expiró. */
export function takeVerificationUrl(email: string): string | undefined {
  const key = email.toLowerCase();
  const entry = verificationUrls.get(key);
  verificationUrls.delete(key);
  if (!entry || entry.expires <= Date.now()) return undefined;
  return entry.url;
}

// BETTER_AUTH_SECRET y BETTER_AUTH_URL se leen automáticamente del entorno.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Sin mailer real: en desarrollo la URL se registra en el log.
    sendVerificationEmail: ({ user, url }) => {
      if (process.env.NODE_ENV === 'development') {
        logger.log(`URL de verificación: ${url}`);
      }
      if (isVerificationUrlExposed()) {
        storeVerificationUrl(user.email, url);
      }
      return Promise.resolve();
    },
  },

  socialProviders,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // renueva la expiración como máximo una vez al día
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutos
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return;
      const email = (ctx.body as { email?: unknown } | undefined)?.email;
      if (typeof email !== 'string') return;
      const url = takeVerificationUrl(email);
      if (url && isVerificationUrlExposed()) {
        ctx.setHeader(VERIFICATION_URL_HEADER, url);
      }
    }),
  },

  trustedOrigins,
});

/** Tipo de la sesión (session y user) inferido de esta configuración. */
export type Session = typeof auth.$Infer.Session;

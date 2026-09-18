import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../prisma/prisma.service.js';

/** Orígenes permitidos, compartidos por Better Auth y el CORS de Nest. */
export const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// BETTER_AUTH_SECRET y BETTER_AUTH_URL se leen automáticamente del entorno.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // renueva la expiración como máximo una vez al día
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutos
    },
  },

  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;

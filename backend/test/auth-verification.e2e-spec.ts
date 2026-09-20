import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

const ORIGIN = 'http://localhost:5173';
const HEADER = 'x-verification-url';

// Evita que dotenv cargue el .env local y pise el entorno del test.
vi.mock('dotenv/config', () => ({}));

// Better Auth usa la base en memoria; no se necesita PostgreSQL.
vi.mock('better-auth/adapters/prisma', async () => {
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  return {
    prismaAdapter: () =>
      memoryAdapter({ user: [], session: [], account: [], verification: [] }),
  };
});

vi.mock('../src/prisma/prisma.service.js', () => {
  class PrismaService {}
  return { PrismaService, prisma: new PrismaService() };
});

type Env = { flag?: string; nodeEnv?: string };

/** Arranca la app real (AuthModule + CORS como main.ts) con el entorno dado. */
async function bootstrap({ flag, nodeEnv = 'development' }: Env) {
  process.env.BETTER_AUTH_SECRET = 'e2e-secret-e2e-secret-e2e-secret-1234';
  process.env.BETTER_AUTH_URL = 'http://localhost:3001';
  process.env.TRUSTED_ORIGINS = ORIGIN;
  process.env.NODE_ENV = nodeEnv;
  // Vacío en lugar de delete: ConfigModule.forRoot() recargaría el .env local.
  process.env.EXPOSE_VERIFICATION_URL = flag ?? '';

  vi.resetModules();
  const { Test } = await import('@nestjs/testing');
  const { AppModule } = await import('../src/app.module.js');
  const { trustedOrigins } = await import('../src/modules/auth/auth.js');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
    exposedHeaders: ['X-Verification-Url'],
  });
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

const signUp = (app: INestApplication, email: string, password = 'secret123') =>
  request(app.getHttpServer())
    .post('/api/auth/sign-up/email')
    .set('Origin', ORIGIN)
    .send({ name: 'Test', email, password });

const signIn = (app: INestApplication, email: string, password = 'secret123') =>
  request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .set('Origin', ORIGIN)
    .send({ email, password });

describe('Auth verification URL (e2e)', () => {
  const originalEnv = { ...process.env };
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    process.env = { ...originalEnv };
  });

  describe('EXPOSE_VERIFICATION_URL=true en desarrollo', () => {
    beforeEach(async () => {
      app = await bootstrap({ flag: 'true' });
    });

    it('sign-up devuelve 200 y X-Verification-Url', async () => {
      const res = await signUp(app!, 'a@example.com').expect(200);
      expect(res.headers[HEADER]).toMatch(
        /^http:\/\/localhost:3001\/api\/auth\/verify-email\?token=/,
      );
    });

    it('sign-up duplicado no devuelve la cabecera', async () => {
      await signUp(app!, 'dup@example.com').expect(200);
      const res = await signUp(app!, 'dup@example.com');
      expect(res.headers[HEADER]).toBeUndefined();
    });

    it('rechaza contraseñas de 5 caracteres y acepta 6', async () => {
      await signUp(app!, 'short@example.com', '12345').expect(400);
      await signUp(app!, 'six@example.com', '123456').expect(200);
    });

    it('flujo completo: 403 sin verificar, verifica con 302 y luego 200', async () => {
      const email = 'flow@example.com';
      const res = await signUp(app!, email).expect(200);
      const verificationUrl = res.headers[HEADER] as string;

      const denied = await signIn(app!, email).expect(403);
      expect(denied.body.code).toBe('EMAIL_NOT_VERIFIED');

      const url = new URL(verificationUrl);
      const verify = await request(app!.getHttpServer())
        .get(`${url.pathname}${url.search}`)
        .set('Origin', ORIGIN)
        .expect(302);
      expect(verify.headers['set-cookie']).toBeDefined();

      await signIn(app!, email).expect(200);
    });

    it('CORS expone X-Verification-Url a un origen de confianza', async () => {
      const res = await signUp(app!, 'cors@example.com').expect(200);
      expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
      expect(res.headers['access-control-expose-headers']).toContain(
        'X-Verification-Url',
      );
    });
  });

  it('flag desactivado: sin cabecera', async () => {
    app = await bootstrap({ flag: 'false' });
    const res = await signUp(app, 'off@example.com').expect(200);
    expect(res.headers[HEADER]).toBeUndefined();
  });

  it('flag vacío: sin cabecera', async () => {
    app = await bootstrap({});
    const res = await signUp(app, 'unset@example.com').expect(200);
    expect(res.headers[HEADER]).toBeUndefined();
  });

  it('NODE_ENV=production con flag activo: sin cabecera', async () => {
    app = await bootstrap({ flag: 'true', nodeEnv: 'production' });
    const res = await signUp(app, 'prod@example.com').expect(200);
    expect(res.headers[HEADER]).toBeUndefined();
  });
});

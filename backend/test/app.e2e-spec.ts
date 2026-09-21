import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Misma configuración que src/main.ts.
    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ data: { status: 'ok' } });
  });

  it('/api/v1/users/me (GET) requires a session', () => {
    return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('/api/auth/* stays outside the global prefix', () => {
    return request(app.getHttpServer())
      .get('/api/auth/ok')
      .expect(200)
      .expect({ ok: true });
  });

  afterEach(async () => {
    await app.close();
  });
});

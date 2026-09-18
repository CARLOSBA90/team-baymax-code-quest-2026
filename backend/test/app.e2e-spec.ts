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
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ data: { status: 'ok' } });
  });

  it('/api/users/me (GET) requires a session', () => {
    return request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});

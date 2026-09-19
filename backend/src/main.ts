import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { trustedOrigins } from './modules/auth/auth.js';

/** Arranca la API con CORS, prefijo global api/v1 y el puerto de PORT. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Better Auth lee el body crudo; AuthModule reactiva los parsers JSON y
    // urlencoded en las demás rutas.
    bodyParser: false,
  });

  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
  });

  // Sin opciones a propósito: AuthModule ya excluye /api/auth del prefijo y
  // pasar exclude aquí reemplazaría esa exclusión.
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

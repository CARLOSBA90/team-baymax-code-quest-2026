import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { trustedOrigins } from './modules/auth/auth.js';

/** Arranca la API con validación, CORS, prefijo api/v1 y el puerto de PORT. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Better Auth lee el body crudo; AuthModule reactiva los parsers JSON y
    // urlencoded en las demás rutas.
    bodyParser: false,
  });

  // Valida los DTOs de clase con class-validator; las interfaces no se validan.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
    // Permite al frontend leer la URL de verificación (solo en desarrollo).
    exposedHeaders: ['X-Verification-Url'],
  });

  // Sin opciones a propósito: AuthModule ya excluye /api/auth del prefijo y
  // pasar exclude aquí reemplazaría esa exclusión.
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();

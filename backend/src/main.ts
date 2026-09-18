import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { trustedOrigins } from './auth/auth.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Better Auth necesita el body crudo. AuthModule vuelve a registrar los
    // parsers JSON y urlencoded para el resto de las rutas.
    bodyParser: false,
  });

  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
  });

  // Sin opciones a propósito: AuthModule ya excluye /api/auth/* del prefijo
  // global, y pasar `exclude` aquí reemplazaría esa exclusión.
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

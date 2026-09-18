# NestJS Scaffolding — Spec-Kit

> Guia paso a paso para configurar el backend NestJS como un Monolito Modular siguiendo las convenciones de CodeQuest.

---

## Prerrequisitos

```bash
# Verificar versiones
node -v   # >= 20.x
pnpm -v   # >= 9.x

# Instalar NestJS CLI globalmente
pnpm add -g @nestjs/cli

# Verificar instalacion
nest --version
```

---

## Paso 1: El Proyecto Backend

El backend de CodeQuest es un **unico proyecto NestJS** ubicado en `backend/`. No se crea ni se separa en multiples servicios.

```bash
# Instalar dependencias del backend existente
cd backend
pnpm install
```

> El proyecto ya fue inicializado. No se ejecuta `nest new` nuevamente a menos que se parta desde cero.

---

## Paso 2: Dependencias Base

Instalar en el backend todas las dependencias necesarias:

```bash
cd backend

# Validacion y transformacion
pnpm add class-validator class-transformer

# Documentacion API
pnpm add @nestjs/swagger

# (Ya instalados por el scaffold base)
# @nestjs/config, @prisma/client, prisma, better-auth, @thallesp/nestjs-better-auth
```

---

## Paso 3: Configuracion Inicial

### 3.1 — Habilitar validacion global

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Requerido para Better Auth
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
```

### 3.2 — Configurar variables de entorno

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
```

```bash
# .env.example (en la raiz del backend/)
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/codequest
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Better Auth
BETTER_AUTH_SECRET=your-secret-here

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

### 3.3 — Configurar Prisma

```bash
# Inicializar Prisma (si no esta inicializado)
npx prisma init

# Esto crea:
# - prisma/schema.prisma
# - .env (con DATABASE_URL)
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Agregar modelos aqui...
```

### 3.4 — Crear PrismaService

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## Paso 4: Estructura de Carpetas

Consulta [structure.md](./structure.md) para la estructura completa recomendada.

---

## Paso 5: Crear un Modulo (Resource CRUD)

Usa el CLI de NestJS para generar un resource completo dentro del directorio `modules/`:

```bash
# Genera controller, service, module, DTOs y entity
nest generate resource modules/roadmaps --no-spec

# O con el shorthand
nest g res modules/assessments --no-spec
nest g res modules/notifications --no-spec
```

Esto genera la estructura base. Consulta el [ejemplo completo de resource](./example-resource/) para ver como implementar un CRUD completo con Prisma.

---

## Paso 6: Swagger (Documentacion)

```typescript
// src/main.ts (agregar antes de app.listen)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ... dentro de bootstrap()
const config = new DocumentBuilder()
  .setTitle('CodeQuest API')
  .setDescription('API de CodeQuest — Monolito Modular')
  .setVersion('1.0')
  .addCookieAuth('better-auth.session_token')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

> Accede a la documentacion en `http://localhost:3001/api/docs`

---

## Checklist de Setup

- [ ] Dependencias instaladas (`pnpm install` en `backend/`)
- [ ] `ValidationPipe` global configurado
- [ ] CORS habilitado con `credentials: true`
- [ ] `ConfigModule` importado en `AppModule`
- [ ] `.env` creado a partir de `.env.example`
- [ ] Prisma inicializado y schema configurado
- [ ] PrismaService y PrismaModule creados
- [ ] Swagger configurado
- [ ] Primer modulo generado con el CLI

---

## Recursos Relacionados

- [Estructura de carpetas](./structure.md)
- [Ejemplo de resource CRUD](./example-resource/)
- [Better Auth setup](../better-auth/README.md)

# 🏗 NestJS Scaffolding — Spec-Kit

> Guía paso a paso para crear un backend NestJS desde cero siguiendo las convenciones de CodeQuest.

---

## 📋 Prerrequisitos

```bash
# Verificar versiones
node -v   # >= 20.x
pnpm -v   # >= 9.x

# Instalar NestJS CLI globalmente
pnpm add -g @nestjs/cli

# Verificar instalación
nest --version
```

---

## 🚀 Paso 1: Crear el Proyecto

```bash
# Desde la carpeta backend/
cd backend

# Crear nuevo proyecto NestJS
nest new auth-api --package-manager pnpm --strict
# ó
nest new core-api --package-manager pnpm --strict
# ó
nest new notifications-api --package-manager pnpm --strict
```

> 💡 El flag `--strict` habilita TypeScript strict mode desde el inicio.

---

## 📦 Paso 2: Dependencias Base

Instalar en cada backend las dependencias comunes:

```bash
cd backend/<nombre-del-backend>

# Validación y transformación
pnpm add class-validator class-transformer

# Configuración
pnpm add @nestjs/config

# Base de datos (Prisma)
pnpm add @prisma/client
pnpm add -D prisma

# Swagger (documentación API)
pnpm add @nestjs/swagger

# Dev dependencies
pnpm add -D @types/node
```

### Dependencias específicas por backend

```bash
# Solo para auth-api
pnpm add better-auth @thallesp/nestjs-better-auth

# Solo para notifications-api
pnpm add @nestjs/bull bull        # Colas de trabajo
pnpm add nodemailer               # Envío de emails
pnpm add -D @types/nodemailer
```

---

## ⚙️ Paso 3: Configuración Inicial

### 3.1 — Habilitar validación global

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extra
      transform: true,            // Transforma payloads a instancias de DTO
    }),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173'], // Frontend React
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
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
# .env.example (crear en la raíz de cada backend)
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/codequest_auth
NODE_ENV=development
```

### 3.3 — Configurar Prisma

```bash
# Inicializar Prisma
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

// Agregar modelos aquí...
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
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 📐 Paso 4: Estructura de Carpetas

Consulta [structure.md](./structure.md) para la estructura completa recomendada.

---

## 🔧 Paso 5: Crear un Resource (CRUD)

Usa el CLI de NestJS para generar un resource completo:

```bash
# Genera controller, service, module, DTOs y entity
nest generate resource tasks --no-spec

# O con el shorthand
nest g res tasks --no-spec
```

Esto genera la estructura base. Consulta el [ejemplo completo de resource](./example-resource/) para ver cómo implementar un CRUD completo con Prisma.

---

## 📝 Paso 6: Swagger (Documentación)

```typescript
// src/main.ts (agregar antes de app.listen)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ... dentro de bootstrap()
const config = new DocumentBuilder()
  .setTitle('CodeQuest Auth API')
  .setDescription('API de autenticación y gestión de usuarios')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

> Accede a la documentación en `http://localhost:3001/api/docs`

---

## ✅ Checklist de Setup

- [ ] Proyecto creado con `nest new`
- [ ] Dependencias instaladas
- [ ] `ValidationPipe` global configurado
- [ ] CORS habilitado
- [ ] `ConfigModule` importado
- [ ] `.env.example` creado
- [ ] Prisma inicializado
- [ ] PrismaService y PrismaModule creados
- [ ] Swagger configurado
- [ ] Primer resource generado con el CLI

---

## 🔗 Recursos Relacionados

- [Estructura de carpetas →](./structure.md)
- [Ejemplo de resource CRUD →](./example-resource/)
- [Better Auth setup →](../better-auth/README.md)

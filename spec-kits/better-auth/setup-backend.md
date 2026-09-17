# 🔐 Better Auth — Setup Backend (NestJS)

> Guía paso a paso para configurar Better Auth en un backend NestJS.

---

## 📦 Paso 1: Instalar Dependencias

```bash
cd backend/auth-api

# Better Auth core + integración NestJS
pnpm add better-auth @thallesp/nestjs-better-auth

# Adapter de base de datos (Prisma)
# Si ya tienes Prisma instalado, no hace falta reinstalarlo
pnpm add @prisma/client
```

---

## ⚙️ Paso 2: Configurar la Instancia de Better Auth

Crear el archivo de configuración central de Better Auth:

```typescript
// src/auth/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Base de datos
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Métodos de autenticación habilitados
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Poner en true en producción
  },

  // Configuración de sesión
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24,      // Actualizar cada 24 horas
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache de 5 minutos
    },
  },

  // URLs permitidas (CORS de Better Auth)
  trustedOrigins: ['http://localhost:5173'],
});

// Exportar el tipo para usar en decoradores
export type Session = typeof auth.$Infer.Session;
```

---

## 🗄️ Paso 3: Generar Schema de Base de Datos

Better Auth necesita tablas específicas en tu base de datos. Tienes 2 opciones:

### Opción A: Generar con CLI de Better Auth (Recomendado)

```bash
# Genera las migraciones necesarias automáticamente
npx @better-auth/cli generate --config ./src/auth/auth.ts --output ./prisma/migrations
```

### Opción B: Agregar manualmente al schema de Prisma

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  accountId         String
  providerId        String
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken       String?
  refreshToken      String?
  idToken           String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  password          String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

Después de agregar los modelos:

```bash
npx prisma migrate dev --name add-better-auth-tables
npx prisma generate
```

---

## 🔌 Paso 4: Integrar con NestJS

### 4.1 — Desactivar Body Parser por defecto

Better Auth necesita manejar el body de las requests internamente:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // ⚠️ REQUERIDO para Better Auth
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true, // ⚠️ Necesario para cookies de sesión
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

### 4.2 — Registrar AuthModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './prisma/prisma.module';
import { auth } from './auth/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    // Registrar Better Auth
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
  ],
})
export class AppModule {}
```

> ✅ Con esto, Better Auth maneja automáticamente todas las rutas bajo `/api/auth/*` (signup, signin, signout, session, etc.)

---

## 🛡️ Paso 5: Proteger Endpoints

El `AuthModule` habilita un **guard global** por defecto. Todos los endpoints están protegidos salvo que los marques explícitamente como públicos.

### Decoradores Disponibles

```typescript
import {
  Session,
  AllowAnonymous,
  OptionalAuth,
} from '@thallesp/nestjs-better-auth';
```

| Decorador | Uso |
|-----------|-----|
| `@Session()` | Inyecta la sesión del usuario en el método |
| `@AllowAnonymous()` | Hace el endpoint público (sin auth) |
| `@OptionalAuth()` | Permite acceso con o sin auth |

### Ejemplo: Controller con Endpoints Protegidos

```typescript
// src/modules/users/users.controller.ts
import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  Session,
  AllowAnonymous,
  OptionalAuth,
} from '@thallesp/nestjs-better-auth';
import type { Session as UserSession } from '../auth/auth';

@Controller('users')
export class UsersController {
  /**
   * GET /api/v1/users/me
   * Endpoint PROTEGIDO — requiere sesión válida
   * Retorna el perfil del usuario autenticado
   */
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return {
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };
  }

  /**
   * PATCH /api/v1/users/me
   * Endpoint PROTEGIDO — actualizar perfil
   */
  @Patch('me')
  async updateProfile(
    @Session() session: UserSession,
    @Body() body: { name?: string },
  ) {
    // Aquí iría la lógica de actualización
    return {
      message: 'Perfil actualizado',
      data: { id: session.user.id, name: body.name },
    };
  }

  /**
   * GET /api/v1/users/public-stats
   * Endpoint PÚBLICO — no requiere auth
   */
  @Get('public-stats')
  @AllowAnonymous()
  async getPublicStats() {
    return {
      data: { totalUsers: 150, activeToday: 42 },
    };
  }

  /**
   * GET /api/v1/users/greeting
   * Endpoint OPCIONAL — funciona con y sin auth
   */
  @Get('greeting')
  @OptionalAuth()
  async getGreeting(@Session() session?: UserSession) {
    if (session) {
      return { message: `Hola, ${session.user.name}!` };
    }
    return { message: 'Hola, visitante!' };
  }
}
```

---

## 🧪 Paso 6: Probar con Postman/Thunder Client

### Registrar un usuario

```http
POST http://localhost:3001/api/auth/sign-up/email
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

### Iniciar sesión

```http
POST http://localhost:3001/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

> La respuesta incluirá una cookie `better-auth.session_token`. El navegador la envía automáticamente en las siguientes requests.

### Obtener sesión actual

```http
GET http://localhost:3001/api/auth/get-session
Cookie: better-auth.session_token=<token>
```

### Acceder a endpoint protegido

```http
GET http://localhost:3001/api/v1/users/me
Cookie: better-auth.session_token=<token>
```

---

## ✅ Checklist de Implementación

- [ ] Instalar `better-auth` y `@thallesp/nestjs-better-auth`
- [ ] Crear `src/auth/auth.ts` con la config de Better Auth
- [ ] Generar/agregar tablas de auth en el schema de Prisma
- [ ] Correr migraciones (`prisma migrate dev`)
- [ ] Desactivar `bodyParser` en `main.ts`
- [ ] Agregar `credentials: true` al CORS
- [ ] Registrar `AuthModule.forRoot()` en `AppModule`
- [ ] Crear un endpoint protegido de prueba
- [ ] Probar signup + signin con Postman
- [ ] Verificar que la sesión persiste

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot parse body` | Body parser no desactivado | Agregar `bodyParser: false` en `NestFactory.create` |
| `CORS blocked` | Frontend no en `trustedOrigins` | Agregar la URL del frontend a `trustedOrigins` y CORS |
| `Session not found` | Cookie no enviada | Verificar `credentials: true` en CORS y en el fetch del frontend |
| `Table not found` | Migraciones no corridas | Ejecutar `npx prisma migrate dev` |

---

## 🔗 Siguiente Paso

→ [Setup Frontend (React)](./setup-frontend.md)

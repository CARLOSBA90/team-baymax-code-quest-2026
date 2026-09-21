# Better Auth — Setup Backend (NestJS)

> Guia para configurar Better Auth en el backend NestJS de CodeQuest (Monolito Modular).
> Incluye configuracion de Discord OAuth.

---

## Paso 1: Instalar Dependencias

```bash
cd backend

# Better Auth core + integracion NestJS (ya instalados en el scaffold base)
# pnpm add better-auth @thallesp/nestjs-better-auth

# Verificar que esten en package.json
pnpm list better-auth @thallesp/nestjs-better-auth
```

---

## Paso 2: Configurar la Instancia de Better Auth

Crear el archivo de configuracion central de Better Auth con soporte para Discord:

```typescript
// src/modules/auth/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Base de datos
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Metodos de autenticacion habilitados
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Proveedores sociales — Discord es requerimiento de la hackathon
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },

  // Configuracion de sesion
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,      // Actualizar cada 24 horas
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache de 5 minutos
    },
  },

  // URLs permitidas (CORS de Better Auth)
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
});

// Exportar el tipo para usar en decoradores
export type Session = typeof auth.$Infer.Session;
```

> Variables requeridas en `.env`:
> - `DISCORD_CLIENT_ID` — Client ID de tu aplicacion en Discord Developer Portal
> - `DISCORD_CLIENT_SECRET` — Client Secret de tu aplicacion en Discord Developer Portal
> - `FRONTEND_URL` — URL del frontend (default: `http://localhost:5173`)

---

## Paso 3: Configurar Discord OAuth en el Developer Portal

1. Ir a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crear una nueva aplicacion o abrir la existente
3. Ir a la seccion "OAuth2"
4. Agregar el redirect URI:
   - Desarrollo: `http://localhost:3001/api/auth/callback/discord`
   - Produccion: `https://tu-dominio.com/api/auth/callback/discord`
5. Copiar el **Client ID** y **Client Secret** al `.env`

---

## Paso 4: Generar Schema de Base de Datos

Better Auth necesita tablas especificas en tu base de datos. Tienes 2 opciones:

### Opcion A: Generar con CLI de Better Auth (Recomendado)

```bash
# Genera las migraciones necesarias automaticamente
npx @better-auth/cli generate --config ./src/modules/auth/auth.ts --output ./prisma/migrations
```

### Opcion B: Agregar manualmente al schema de Prisma

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
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?

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

Despues de agregar los modelos:

```bash
npx prisma migrate dev --name add-better-auth-tables
npx prisma generate
```

---

## Paso 5: Integrar con NestJS

### 5.1 — Configurar main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // REQUERIDO para Better Auth
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
    credentials: true, // Necesario para cookies de sesion
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

### 5.2 — Registrar AuthModule en AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './prisma/prisma.module.js';
import { auth } from './modules/auth/auth.js';
import { UsersModule } from './modules/users/users.module.js';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module.js';
import { AssessmentsModule } from './modules/assessments/assessments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    // Registrar Better Auth (instala guard global automaticamente)
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),

    // Modulos de dominio
    UsersModule,
    RoadmapsModule,
    AssessmentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

> Con esto, Better Auth maneja automaticamente todas las rutas bajo `/api/auth/*` (signup, signin, signout, session, discord callback, etc.)

---

## Paso 6: Proteger Endpoints

El `AuthModule` habilita un **guard global** por defecto. Todos los endpoints estan protegidos salvo que los marques explicitamente como publicos.

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
| `@Session()` | Inyecta la sesion del usuario en el metodo |
| `@AllowAnonymous()` | Hace el endpoint publico (sin auth) |
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
import type { Session as UserSession } from '../auth/auth.js';

@Controller('users')
export class UsersController {
  /**
   * GET /api/v1/users/me
   * Endpoint PROTEGIDO - requiere sesion valida
   */
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return {
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    };
  }

  /**
   * PATCH /api/v1/users/me
   * Endpoint PROTEGIDO - actualizar perfil
   */
  @Patch('me')
  async updateProfile(
    @Session() session: UserSession,
    @Body() body: { name?: string },
  ) {
    return {
      message: 'Perfil actualizado',
      data: { id: session.user.id, name: body.name },
    };
  }

  /**
   * GET /api/v1/users/public-stats
   * Endpoint PUBLICO - no requiere auth
   */
  @Get('public-stats')
  @AllowAnonymous()
  async getPublicStats() {
    return {
      data: { totalUsers: 150, activeToday: 42 },
    };
  }
}
```

---

## Paso 7: Probar con Postman/Thunder Client

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

### Iniciar sesion con email

```http
POST http://localhost:3001/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

### Iniciar sesion con Discord (flujo OAuth)

El flujo de Discord es redireccionado desde el frontend. El inicio es un POST (no existe `GET /api/auth/signin/discord`):

```
POST http://localhost:3001/api/auth/sign-in/social
Content-Type: application/json

{ "provider": "discord", "callbackURL": "http://localhost:5173/" }
```

Better Auth maneja el callback automaticamente en:
```
GET http://localhost:3001/api/auth/callback/discord
```

### Obtener sesion actual

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

## Notas de la implementacion actual (email, verificacion y providers)

- **Providers sociales**: Google (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`), GitHub (`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`) y Discord (`DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`). Callbacks: `http://localhost:3001/api/auth/callback/{google|github|discord}` (cambiar host en produccion).
- **`callbackURL`** enviado desde el front debe ser una URL absoluta y su origen debe estar en `trustedOrigins`; si no, Better Auth lo rechaza.
- **Password**: `minPasswordLength: 6`.
- **`requireEmailVerification: true`**: un sign-in con email sin verificar responde `403` con codigo `EMAIL_NOT_VERIFIED`. No se reenvia el correo porque `sendOnSignIn` no esta configurado.
- **Header `X-Verification-Url` (solo desarrollo)**: en `POST /api/auth/sign-up/email` la respuesta incluye la URL de verificacion para poder probar sin correo. Solo se emite si `EXPOSE_VERIFICATION_URL === 'true' && NODE_ENV === 'development'` (con `NODE_ENV` sin definir, `staging`, `test` o `production` no se emite). La URL (sin el email) solo se registra en el log cuando `NODE_ENV === 'development'`. Para que el navegador pueda leerlo, el CORS de `main.ts` debe incluir `exposedHeaders: ['X-Verification-Url']`.
- **Trampa con `AsyncLocalStorage`**: en better-auth 1.7.5 el contexto NO se propaga entre `sendVerificationEmail` y la respuesta HTTP. Solucion usada: un `Map` indexado por email (TTL 60s) que guarda la URL en `sendVerificationEmail` y se lee en `hooks.after` para setear el header.

---

## Checklist de Implementacion

- [ ] Crear aplicacion en Discord Developer Portal y obtener Client ID/Secret
- [ ] Agregar variables de entorno al `.env` (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET)
- [ ] Crear `src/modules/auth/auth.ts` con la config de Better Auth y Discord
- [ ] Generar/agregar tablas de auth en el schema de Prisma
- [ ] Correr migraciones (`prisma migrate dev`)
- [ ] Desactivar `bodyParser` en `main.ts`
- [ ] Agregar `credentials: true` al CORS
- [ ] Registrar `AuthModule.forRoot()` en `AppModule`
- [ ] Crear un endpoint protegido de prueba
- [ ] Probar signup + signin con Postman
- [ ] Probar flujo Discord OAuth
- [ ] Verificar que la sesion persiste

---

## Errores Comunes

| Error | Causa | Solucion |
|-------|-------|----------|
| `Cannot parse body` | Body parser no desactivado | Agregar `bodyParser: false` en `NestFactory.create` |
| `CORS blocked` | Frontend no en `trustedOrigins` | Agregar la URL del frontend a `trustedOrigins` y CORS |
| `Session not found` | Cookie no enviada | Verificar `credentials: true` en CORS y en el fetch del frontend |
| `Table not found` | Migraciones no corridas | Ejecutar `npx prisma migrate dev` |
| `Discord redirect_uri_mismatch` | URI no registrado en Discord | Agregar `http://localhost:3001/api/auth/callback/discord` al Discord Developer Portal |
| `Invalid DISCORD_CLIENT_ID` | Variable de entorno vacia | Verificar `.env` y que la app no haya cargado variables en cache |

---

## Siguiente Paso

[Setup Frontend (React)](./setup-frontend.md)

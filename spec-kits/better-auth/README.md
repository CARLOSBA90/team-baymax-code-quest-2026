# Better Auth — Spec-Kit

> Instructivo paso a paso para implementar autenticacion con Better Auth en el proyecto CodeQuest.
> Incluye autenticacion con Discord (requerimiento obligatorio de la hackathon).

---

## Que es Better Auth?

[Better Auth](https://www.better-auth.com/) es una libreria de autenticacion moderna para TypeScript que proporciona:

- Autenticacion por email/contrasena
- OAuth social (Discord, Google, GitHub, etc.)
- Gestion de sesiones
- Sistema de roles
- Rate limiting integrado

### Por que Better Auth?

| Caracteristica | Better Auth | Auth.js | Passport |
|----------------|-------------|---------|----------|
| TypeScript nativo | Si | Si | No |
| Zero config DB | Si | No | No |
| Sesiones built-in | Si | Si | No |
| NestJS support | Si (via plugin) | No | Si |
| React hooks | Si | Si | No |
| Discord OAuth | Si | Si | Si |

---

## Prerrequisitos

- Backend NestJS ya scaffolded (ver [NestJS Scaffolding](../nestjs-scaffolding/README.md))
- PostgreSQL corriendo
- Prisma configurado
- Aplicacion Discord creada en [Discord Developer Portal](https://discord.com/developers/applications)

---

## Guias de Implementacion

### 1. [Setup Backend (NestJS)](./setup-backend.md)
Configuracion completa del servidor de autenticacion:
- Instalacion de dependencias
- Configuracion del `auth.ts` con soporte para Discord OAuth
- Integracion con NestJS via `AuthModule`
- Guards y decoradores
- Ejemplo de endpoint protegido

### 2. [Setup Frontend (React)](./setup-frontend.md)
Configuracion del cliente en React:
- Instalacion del cliente
- `createAuthClient` y hooks
- Boton de inicio de sesion con Discord
- Proteccion de rutas

---

## Arquitectura de Auth en CodeQuest (Monolito Modular)

```
+------------------------+
|    Frontend React      |
|                        |
|  createAuthClient      |
|  useSession()          |
|  signIn.social()       |
|  (Discord OAuth)       |
+----------+-------------+
           |
           | HTTP (cookies)
           v
+---------------------------------------------+     +--------------------+
|    Backend NestJS (:3001)                   |     |    PostgreSQL       |
|                                             |     |                    |
|  /api/auth/*  - Better Auth handlers        +---->+  user              |
|  /api/v1/*    - Modulos de negocio          |     |  session           |
|                                             |     |  account           |
|  AuthModule instala guard global:           |     |  verification      |
|  - Todos los endpoints protegidos           |     |                    |
|  - @AllowAnonymous() para endpoints publicos|     |                    |
+---------------------------------------------+     +--------------------+
```

> Sin llamadas HTTP entre servicios internos. Todo en el mismo proceso de Node.js.

---

## Importante

> Este spec-kit es un INSTRUCTIVO de aprendizaje. No implementa Better Auth completo en el proyecto.
> Su objetivo es que el desarrollador entienda los conceptos y pueda implementarlo siguiendo los pasos.

### Orden de implementacion recomendado:

1. Leer esta guia completa
2. Crear aplicacion Discord en el Developer Portal
3. Hacer el [setup del backend](./setup-backend.md)
4. Probar con Postman/Thunder Client
5. Hacer el [setup del frontend](./setup-frontend.md)
6. Integrar con el flujo completo

---

## Recursos Externos

- [Documentacion oficial de Better Auth](https://www.better-auth.com/docs)
- [GitHub: nestjs-better-auth](https://github.com/ThallesP/nestjs-better-auth)
- [Better Auth — Social Providers (Discord)](https://www.better-auth.com/docs/authentication/discord)
- [Discord Developer Portal](https://discord.com/developers/applications)

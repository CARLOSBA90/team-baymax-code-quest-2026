# 🔐 Better Auth — Spec-Kit

> Instructivo paso a paso para implementar autenticación con Better Auth en el proyecto CodeQuest.

---

## ¿Qué es Better Auth?

[Better Auth](https://www.better-auth.com/) es una librería de autenticación moderna para TypeScript que proporciona:

- ✅ Autenticación por email/contraseña
- ✅ OAuth (Google, GitHub, etc.)
- ✅ Gestión de sesiones
- ✅ Sistema de roles
- ✅ Two-Factor Authentication (2FA)
- ✅ Rate limiting integrado

### ¿Por qué Better Auth?

| Característica | Better Auth | Auth.js | Passport |
|---------------|-------------|---------|----------|
| TypeScript nativo | ✅ | ✅ | ❌ |
| Zero config DB | ✅ | ❌ | ❌ |
| Sesiones built-in | ✅ | ✅ | ❌ |
| NestJS support | ✅ (vía plugin) | ❌ | ✅ |
| React hooks | ✅ | ✅ | ❌ |

---

## 📋 Prerrequisitos

- NestJS backend ya scaffolded (ver [NestJS Scaffolding](../nestjs-scaffolding/README.md))
- PostgreSQL corriendo
- Prisma configurado

---

## 📂 Guías de Implementación

### 1. [Setup Backend (NestJS)](./setup-backend.md)
Configuración completa del servidor de autenticación:
- Instalación de dependencias
- Configuración del `auth.ts`
- Integración con NestJS via `AuthModule`
- Guards y decoradores
- Ejemplo de endpoint protegido

### 2. [Setup Frontend (React)](./setup-frontend.md)
Configuración del cliente en React:
- Instalación del cliente
- `createAuthClient` y hooks
- Componentes de login/registro
- Protección de rutas

---

## 🏗 Arquitectura de Auth en CodeQuest

```
┌────────────────────┐
│   Frontend React   │
│                    │
│  createAuthClient  │
│  useSession()      │
│  signIn / signOut  │
└────────┬───────────┘
         │ HTTP (cookies)
         ▼
┌────────────────────┐     ┌──────────────────┐
│   Auth API (:3001) │────▶│   PostgreSQL     │
│                    │     │                  │
│   Better Auth      │     │  - user          │
│   /api/auth/*      │     │  - session       │
│                    │     │  - account        │
│   Custom endpoints │     │  - verification  │
│   /api/v1/users/*  │     │                  │
└────────────────────┘     └──────────────────┘
         ▲
         │ HTTP interno (validar tokens)
         │
┌────────────────────┐
│  Core API (:3002)  │
│  Notif API (:3003) │
│                    │
│  Validan sesiones  │
│  contra Auth API   │
└────────────────────┘
```

---

## ⚠️ Importante

> **Este spec-kit es un INSTRUCTIVO de aprendizaje.** No implementa Better Auth completo en el proyecto.
> Su objetivo es que el desarrollador entienda los conceptos y pueda implementarlo siguiendo los pasos.

### Orden de implementación recomendado:

1. Leer esta guía completa
2. Hacer el [setup del backend](./setup-backend.md)
3. Probar con Postman/Thunder Client
4. Hacer el [setup del frontend](./setup-frontend.md)
5. Integrar con el flujo completo

---

## 🔗 Recursos Externos

- [Documentación oficial de Better Auth](https://www.better-auth.com/docs)
- [GitHub: nestjs-better-auth](https://github.com/ThallesP/nestjs-better-auth)
- [Better Auth — Database Adapters](https://www.better-auth.com/docs/adapters)

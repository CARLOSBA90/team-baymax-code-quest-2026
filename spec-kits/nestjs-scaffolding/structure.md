# Estructura de Carpetas — NestJS Backend (Monolito Modular)

> Estructura recomendada para el backend de CodeQuest. Un unico proyecto NestJS con modulos de dominio independientes.

---

## Estructura General

```
backend/
+-- src/
|   +-- main.ts                         # Entry point, bootstrap
|   +-- app.module.ts                   # Root module
|   +-- app.controller.ts               # Health check / root endpoint
|   +-- app.service.ts                  # App service
|   |
|   +-- common/                         # Codigo compartido dentro del backend
|   |   +-- decorators/                 # Decoradores custom
|   |   |   +-- current-user.decorator.ts
|   |   +-- filters/                    # Exception filters
|   |   |   +-- http-exception.filter.ts
|   |   +-- guards/                     # Guards de autorizacion
|   |   |   +-- roles.guard.ts
|   |   +-- interceptors/               # Interceptors
|   |   |   +-- logging.interceptor.ts
|   |   +-- pipes/                      # Pipes de validacion custom
|   |   +-- interfaces/                 # Interfaces y tipos compartidos
|   |       +-- pagination.interface.ts
|   |
|   +-- config/                         # Configuracion
|   |   +-- app.config.ts               # Configuracion de la app
|   |   +-- database.config.ts          # Configuracion de DB
|   |
|   +-- prisma/                         # Prisma ORM
|   |   +-- prisma.module.ts
|   |   +-- prisma.service.ts
|   |
|   +-- modules/                        # Modulos de dominio (resources)
|       +-- auth/                       # Configuracion de Better Auth + Discord
|       |   +-- auth.ts                 # Instancia de betterAuth()
|       |
|       +-- users/                      # Perfil y gestion de usuarios
|       |   +-- users.module.ts
|       |   +-- users.controller.ts
|       |   +-- users.service.ts
|       |   +-- dto/
|       |   |   +-- update-user.dto.ts
|       |   +-- entities/
|       |       +-- user.entity.ts
|       |
|       +-- assessments/                # Cuestionario de habilidades
|       |   +-- assessments.module.ts
|       |   +-- assessments.controller.ts
|       |   +-- assessments.service.ts
|       |   +-- dto/
|       |   |   +-- submit-assessment.dto.ts
|       |   +-- entities/
|       |       +-- assessment.entity.ts
|       |
|       +-- roadmaps/                   # Rutas de aprendizaje generadas
|       |   +-- roadmaps.module.ts
|       |   +-- roadmaps.controller.ts
|       |   +-- roadmaps.service.ts
|       |   +-- dto/
|       |   |   +-- create-roadmap.dto.ts
|       |   |   +-- update-roadmap.dto.ts
|       |   +-- entities/
|       |       +-- roadmap.entity.ts
|       |
|       +-- notifications/              # Notificaciones y preferencias
|           +-- notifications.module.ts
|           +-- notifications.controller.ts
|           +-- notifications.service.ts
|           +-- dto/
|               +-- update-preferences.dto.ts
|
+-- prisma/
|   +-- schema.prisma                   # Schema de la base de datos
|   +-- migrations/                     # Migraciones auto-generadas
|   +-- seed.ts                         # Seed de datos iniciales
|
+-- test/
|   +-- app.e2e-spec.ts                 # Tests end-to-end
|
+-- .env.example                        # Template de variables de entorno
+-- .prettierrc                         # Configuracion Prettier
+-- nest-cli.json                       # Configuracion NestJS CLI
+-- package.json
+-- tsconfig.json
+-- tsconfig.build.json
```

---

## Convenciones de Nombrado

### Archivos

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Module | `<nombre>.module.ts` | `roadmaps.module.ts` |
| Controller | `<nombre>.controller.ts` | `roadmaps.controller.ts` |
| Service | `<nombre>.service.ts` | `roadmaps.service.ts` |
| DTO | `<accion>-<nombre>.dto.ts` | `create-roadmap.dto.ts` |
| Entity | `<nombre>.entity.ts` | `roadmap.entity.ts` |
| Guard | `<nombre>.guard.ts` | `roles.guard.ts` |
| Filter | `<nombre>.filter.ts` | `http-exception.filter.ts` |
| Interceptor | `<nombre>.interceptor.ts` | `logging.interceptor.ts` |
| Decorator | `<nombre>.decorator.ts` | `current-user.decorator.ts` |
| Interface | `<nombre>.interface.ts` | `pagination.interface.ts` |

### Clases y Tipos

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Clase | PascalCase | `RoadmapsController` |
| Service | PascalCase + Service | `RoadmapsService` |
| DTO | PascalCase + Dto | `CreateRoadmapDto` |
| Entity | PascalCase + Entity | `RoadmapEntity` |
| Interface | PascalCase (con prefijo I opcional) | `PaginationResult` |

### Metodos del Controller

| Operacion | Metodo HTTP | Nombre del metodo | Ruta |
|-----------|-------------|-------------------|------|
| Listar | `GET` | `findAll()` | `/roadmaps` |
| Obtener uno | `GET` | `findOne()` | `/roadmaps/:id` |
| Crear | `POST` | `create()` | `/roadmaps` |
| Actualizar | `PATCH` | `update()` | `/roadmaps/:id` |
| Eliminar | `DELETE` | `remove()` | `/roadmaps/:id` |

---

## Reglas de Organizacion

1. **Un modulo por dominio** — Cada entidad/recurso tiene su propio modulo bajo `src/modules/`
2. **`common/` para codigo reutilizable** — Guards, filters, decorators compartidos entre modulos
3. **DTOs siempre** — Nunca aceptar `any` o `body` sin tipar
4. **Entities para respuesta** — Las entities definen la forma de la respuesta (no confundir con el model de Prisma)
5. **Sin logica en controllers** — Los controllers solo delegan al service
6. **Un service, una responsabilidad** — Si un service crece mucho, dividirlo en sub-servicios

---

## Ejemplo de Generacion con CLI

```bash
# Generar un modulo completo dentro de modules/
nest g res modules/roadmaps --no-spec
nest g res modules/assessments --no-spec
nest g res modules/notifications --no-spec

# Generar componentes individuales
nest g module modules/roadmaps
nest g controller modules/roadmaps
nest g service modules/roadmaps

# Generar elementos comunes
nest g guard common/guards/roles
nest g filter common/filters/http-exception
nest g interceptor common/interceptors/logging
```

> Nota: Siempre usar `--no-spec` si no vas a escribir tests unitarios inmediatamente. Se pueden agregar despues.

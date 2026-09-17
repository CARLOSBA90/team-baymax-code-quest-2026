# 📂 Estructura de Carpetas — NestJS Backend

> Estructura recomendada para cada backend de CodeQuest.

---

## Estructura General

```
backend/<nombre-api>/
├── src/
│   ├── main.ts                         # Entry point, bootstrap
│   ├── app.module.ts                   # Root module
│   ├── app.controller.ts              # Health check / root endpoint
│   ├── app.service.ts                 # App service
│   │
│   ├── common/                         # 🔧 Código compartido dentro del backend
│   │   ├── decorators/                # Decoradores custom
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/                   # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/                    # Guards de autorización
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/             # Interceptors
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/                     # Pipes de validación custom
│   │   └── interfaces/               # Interfaces y tipos compartidos
│   │       └── pagination.interface.ts
│   │
│   ├── config/                        # ⚙️ Configuración
│   │   ├── app.config.ts             # Configuración de la app
│   │   └── database.config.ts        # Configuración de DB
│   │
│   ├── prisma/                        # 🗄️ Prisma ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── modules/                       # 📦 Módulos de negocio (resources)
│       ├── tasks/
│       │   ├── tasks.module.ts
│       │   ├── tasks.controller.ts
│       │   ├── tasks.service.ts
│       │   ├── dto/
│       │   │   ├── create-task.dto.ts
│       │   │   └── update-task.dto.ts
│       │   └── entities/
│       │       └── task.entity.ts
│       │
│       └── users/
│           ├── users.module.ts
│           ├── users.controller.ts
│           ├── users.service.ts
│           ├── dto/
│           │   ├── create-user.dto.ts
│           │   └── update-user.dto.ts
│           └── entities/
│               └── user.entity.ts
│
├── prisma/
│   ├── schema.prisma                  # Schema de la base de datos
│   ├── migrations/                    # Migraciones auto-generadas
│   └── seed.ts                        # Seed de datos iniciales
│
├── test/
│   ├── app.e2e-spec.ts               # Tests end-to-end
│   └── jest-e2e.json
│
├── .env.example                       # Template de variables de entorno
├── .eslintrc.js                       # Configuración ESLint
├── .prettierrc                        # Configuración Prettier
├── nest-cli.json                      # Configuración NestJS CLI
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## Convenciones de Nombrado

### Archivos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Module | `<nombre>.module.ts` | `tasks.module.ts` |
| Controller | `<nombre>.controller.ts` | `tasks.controller.ts` |
| Service | `<nombre>.service.ts` | `tasks.service.ts` |
| DTO | `<accion>-<nombre>.dto.ts` | `create-task.dto.ts` |
| Entity | `<nombre>.entity.ts` | `task.entity.ts` |
| Guard | `<nombre>.guard.ts` | `roles.guard.ts` |
| Filter | `<nombre>.filter.ts` | `http-exception.filter.ts` |
| Interceptor | `<nombre>.interceptor.ts` | `logging.interceptor.ts` |
| Decorator | `<nombre>.decorator.ts` | `current-user.decorator.ts` |
| Interface | `<nombre>.interface.ts` | `pagination.interface.ts` |

### Clases y Tipos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clase | PascalCase | `TasksController` |
| Service | PascalCase + Service | `TasksService` |
| DTO | PascalCase + Dto | `CreateTaskDto` |
| Entity | PascalCase + Entity | `TaskEntity` |
| Interface | PascalCase (con prefijo I opcional) | `PaginationResult` |

### Métodos del Controller

| Operación | Método HTTP | Nombre del método | Ruta |
|-----------|-------------|-------------------|------|
| Listar | `GET` | `findAll()` | `/tasks` |
| Obtener uno | `GET` | `findOne()` | `/tasks/:id` |
| Crear | `POST` | `create()` | `/tasks` |
| Actualizar | `PATCH` | `update()` | `/tasks/:id` |
| Eliminar | `DELETE` | `remove()` | `/tasks/:id` |

---

## Reglas de Organización

1. **Un módulo por dominio** — Cada entidad/recurso tiene su propio módulo
2. **`common/` para código reutilizable** — Guards, filters, decorators que se usan en múltiples módulos
3. **DTOs siempre** — Nunca aceptar `any` o `body` sin tipar
4. **Entities para respuesta** — Las entities definen la forma de la respuesta (no confundir con el model de Prisma)
5. **Sin lógica en controllers** — Los controllers solo delegan al service
6. **Un service, una responsabilidad** — Si un service crece mucho, dividirlo

---

## Ejemplo de Generación con CLI

```bash
# Generar un módulo completo
nest g res modules/tasks --no-spec

# Generar componentes individuales
nest g module modules/tasks
nest g controller modules/tasks
nest g service modules/tasks

# Generar elementos comunes
nest g guard common/guards/roles
nest g filter common/filters/http-exception
nest g interceptor common/interceptors/logging
```

> ⚠️ **Nota:** Siempre usar `--no-spec` si no vas a escribir tests unitarios inmediatamente. Se pueden agregar después.

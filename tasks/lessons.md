# Lessons Learned

## 2026-09-27 - Strong Typing in In-Memory Caches & Catalog Entities
- **Problema:** Al crear el servicio de caché en memoria [`CatalogCacheService`](file:///c:/Dev/codequest/backend/src/modules/catalog/catalog-cache.service.ts), la interfaz [`CachedCourse`](file:///c:/Dev/codequest/backend/src/modules/catalog/catalog-cache.service.ts) usaba tipos primitivos (`string` para `skill` y `type` en prerrequisitos) en lugar de los enums fuertemente tipados de Prisma (`SkillCategory` y `PrerequisiteType`).
- **Consecuencia:** En [`RoadmapGenerationService`](file:///c:/Dev/codequest/backend/src/modules/roadmaps/roadmap-generation.service.ts), el mapeo a `GeneratorCandidate[]` falló en compilación TypeScript (`TS2322: Type 'string' is not assignable to type 'SkillCategory'`).
- **Solución:**
  1. Definir interfaces de caché con los enums exactos generados por Prisma (`SkillCategory`, `PrerequisiteType`) en lugar de `string`.
  2. Hacer opcional la inyección de caché en constructores de servicios (`catalogCache?: CatalogCacheService`) y utilizar optional chaining (`this.catalogCache?.invalidate()`) para mantener desacopladas las pruebas unitarias existentes.

## 2026-09-27 - NestJS DI and Primitive Constructor Arguments
- **Problema:** En [`CatalogCacheService`](file:///c:/Dev/codequest/backend/src/modules/catalog/catalog-cache.service.ts), el constructor tenía `ttlMs: number = DEFAULT_TTL_MS`.
- **Consecuencia:** NestJS emite los tipos de reflexión TypeScript como `[PrismaService, Number]`. Al inicializar el módulo sin un proveedor explícito para el tipo primitivo `Number`, el inyector de dependencias lanza `UnknownDependenciesException: Nest can't resolve dependencies of the CatalogCacheService (PrismaService, ?)`.
- **Solución:** Usar un Injection Token personalizado con los decoradores `@Optional() @Inject(CATALOG_CACHE_TTL)` y asignar el valor por defecto en el cuerpo del constructor (`this.ttlMs = ttlMs ?? DEFAULT_TTL_MS`). De esta forma NestJS no intenta buscar un provider de tipo `Number` y permite la sobreescritura limpia en tests unitarios.

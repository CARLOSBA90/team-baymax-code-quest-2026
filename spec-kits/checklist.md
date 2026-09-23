# Checklist General — CodeQuest 2026

> División de tareas de alto nivel por área. Ordenado de bloqueante a no bloqueante.
> `🔴 Bloqueante` · `🟡 Depende de otro` · `🟢 Independiente`

---

##

- [x] **Base de datos en la nube (Neon) provisionada y accesible**
- [x] **Migraciones aplicadas** (`pnpm prisma migrate deploy`)
- [x] **Autenticación con Email/Password + verificación** (Better Auth)
- [x] **Login social Discord / Google / GitHub** (proveedores opcionales por env)
- [x] **Seed de preguntas del cuestionario** (`pnpm db:seed`)

---

## Backend

### 🔴 Módulo: Catálogo de Cursos (`catalog`) — BLOQUEANTE para Roadmaps

- [x] Crear modelos Prisma `Course`, `CourseSkill`, `CoursePrerequisite` y migración
- [x] Preparar `courses.csv` con cursos reales de DevTalles (manual: título, URL, nivel, tags)
- [x] Implementar `CatalogModule` + `CatalogService.importFromCsv()`
- [x] Endpoint `POST /api/v1/catalog/import` (solo admin/interno)
- [x] Seed del catálogo con el CSV preparado
- [x] Endpoint `GET /api/v1/catalog/courses` (lista paginada para el frontend — posible implementación de scrapper con cron scheduled)

### 🔴 Módulo: Roadmaps (`roadmaps`) — BLOQUEANTE para Frontend de resultados

> Depende de: Catálogo terminado + Assessment terminado ✅

- [x] Crear modelos Prisma `Roadmap` y `RoadmapItem` y migración
- [x] Implementar `RoadmapGenerationService` (reglas determinísticas por objetivo, skills y prerrequisitos)
- [x] Separar el generador mediante una interfaz intercambiable (`RULES` y `NVIDIA`)
- [x] Registrar proveedores desde sus servicios y resolver fallbacks disponibles por prioridad
- [x] Centralizar proveedor, fallbacks, modelos y timeout en `GeneratorConfigurationService`
- [x] Validar la salida de IA contra el catálogo capturado y aplicar fallback determinístico
- [x] Endpoint `POST /api/v1/roadmaps/generate` (genera y persiste una ruta desde un assessment propio)
- [x] Endpoint `GET /api/v1/roadmaps/` (retorna las rutas del usuario autenticado)
- [x] Endpoint `GET /api/v1/roadmaps/:id` (detalle con `RoadmapItem`, contenido y cursos)
- [x] Endpoint `PATCH /api/v1/roadmaps/:id/pause` (pausa/reanuda con control de versión)

### 🟡 Módulo: Progreso (`progress`)

> Depende de: Roadmaps terminado

- [x] Crear modelo Prisma `Progress` y migración
- [x] Endpoint `PATCH /api/v1/progress/:roadmapItemId` (actualiza porcentaje 0–100 con control de versión)
- [x] Endpoint `GET /api/v1/progress/roadmap/:roadmapId` (resumen porcentual de una ruta)
- [x] Endpoint `POST /api/v1/progress/:roadmapItemId/track` (video, lectura, manual y retos con payload discriminado)
- [x] Reanudación de video e idempotencia acotada mediante `event_id`
- [x] Entregas de retos de texto, código, enlace o archivo con revisión administrativa
- [x] Modelo `ChallengeSubmission` y ampliación aditiva de `Progress`

### ✅ Módulo: Assessments — COMPLETADO

- [x] `GET /api/v1/assessments/questions` — Catálogo de preguntas activas
- [x] `POST /api/v1/assessments/submit` — Submit y cálculo de `profileScores`
- [ ] Deshabilitar endpoint `GET /api/v1/assessments/my-result` (el flujo mostrará directamente el roadmap generado por el assessment)

### ✅ Módulo: Auth — COMPLETADO

- [x] Email/Password con verificación obligatoria
- [x] OAuth: Discord, Google, GitHub (habilitados si las env vars están presentes)
- [x] Header `X-Verification-Url` en desarrollo para tests sin mailer

---

## Frontend

### 🔴 Flujo de Autenticación — BLOQUEANTE para todo lo demás

- [x] Pantalla de Login (Email + botones sociales: Discord, Google, GitHub)
- [x] Pantalla de Registro con validación (contraseña mínimo 6 caracteres)
- [ ] Manejo del estado de sesión global (contexto / store con datos del usuario)
- [ ] Guard de rutas privadas (redirige a login si no hay sesión)
- [ ] Pantalla de "Verificar tu email" (mostrar aviso post-registro)

### 🔴 Flujo del Cuestionario (Assessment UI) — BLOQUEANTE para Dashboard

> Depende de: Auth terminado + `GET /questions` y `POST /submit` disponibles ✅

- [ ] Vista de bienvenida / intro al cuestionario
- [ ] Vista paso a paso de preguntas con opciones (una pregunta por pantalla o todas a la vez)
- [ ] Estado local de respuestas seleccionadas
- [ ] Submit del cuestionario y manejo de loading/error
- [ ] Redirección automática al Dashboard al completar

### 🟡 Dashboard de Resultados y Ruta de Aprendizaje

> Depende de: Assessment UI terminado + Roadmaps API disponible

- [ ] Pantalla de resultados del assessment (`profileScores` visualizados: gráfico de radar o barras)
- [ ] Trigger de generación de ruta (`POST /roadmaps/generate`) al finalizar el assessment
- [ ] Vista de la ruta de aprendizaje: lista ordenada de cursos con `reason` visible
- [ ] Link directo al curso en DevTalles por cada `RoadmapItem`

### 🟡 Seguimiento de Progreso

> Depende de: Dashboard terminado + Progress API disponible

- [ ] Integrar el endpoint estándar de tracking según la política devuelta por cada contenido
- [ ] Indicador visual de progreso global de la ruta (ej: "3 de 8 cursos completados")
- [ ] Persistencia del estado al volver a cargar la página

### 🟢 Perfil de Usuario

- [ ] Página de perfil con nombre, avatar (imagen de proveedor OAuth si existe) y email
- [ ] Botón de cerrar sesión

### 🟢 Pulido UI & Responsive

- [ ] Diseño responsive (mobile-first para la demo)
- [ ] Estados de carga (`skeleton` o `spinner`) en todas las vistas con fetch
- [ ] Manejo de errores de red con mensajes amigables al usuario

---

## Leyenda de estados

| Símbolo | Significado                                       |
| :-----: | :------------------------------------------------ |
|  `[ ]`  | Pendiente                                         |
|  `[/]`  | En progreso                                       |
|  `[x]`  | Completado                                        |
|   🔴    | Bloqueante: otros ítems dependen de esto          |
|   🟡    | Dependiente: necesita que otro ítem esté completo |
|   🟢    | Independiente: se puede trabajar en paralelo      |

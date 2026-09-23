# 04 — Modelo de Datos y Entidades

> **Implementación vigente:** el backend agrega únicamente `Roadmap`,
> `RoadmapItem` y `Progress`. `RoadmapItem.type` discrimina `COURSE`, `MEDIA` y
> `CHALLENGE`; solo un item `COURSE` referencia la tabla existente `Course`.
> Media y retos se conservan como snapshot en el item, sin tablas de catálogo
> adicionales. El schema Prisma y la migración son la fuente de verdad si los
> ejemplos conceptuales posteriores difieren.

> El bloque de schema incluido más abajo es un ejemplo histórico anterior a la
> implementación. No representa el contrato vigente del backend y se conserva
> únicamente como contexto de diseño.

---

## Diagrama de Relaciones (texto)

```
User (Better Auth)
  |---< Assessment (1 usuario, N assessments)
  |       |---< AssessmentAnswer (1 assessment, N respuestas)
  |
  |---< Roadmap (1 usuario, N rutas)
          |---< RoadmapItem (1 ruta, N items = cursos ordenados)
                    |---> Course
                    |---< Progress (1 item, 1 registro de progreso)

Course
  |---< CourseSkill (tags/skills del curso)
  |---< CoursePrerequisite (prerequisitos del curso)

Question (banco de preguntas del cuestionario)
  |---< QuestionOption (opciones de respuesta)

CatalogImport (log de importaciones del catalogo)
```

---

## Schema de Prisma histórico (no vigente)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================================================
// AUTH — Tablas de Better Auth (no modificar estructura base)
// ================================================================

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

  // Relaciones de negocio
  assessments   Assessment[]
  roadmaps      Roadmap[]
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

// ================================================================
// CATALOG — Cursos de DevTalles
// ================================================================

model Course {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  url             String
  description     String?
  level           Int      // 1=beginner, 2=intermediate, 3=advanced
  durationHours   Int?
  status          CourseStatus @default(ACTIVE)
  sourceUpdatedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  skills        CourseSkill[]
  prerequisites CoursePrerequisite[]   @relation("CoursePrerequisites")
  requiredBy    CoursePrerequisite[]   @relation("PrerequisiteOf")
  roadmapItems  RoadmapItem[]
}

enum CourseStatus {
  ACTIVE
  INACTIVE
  PENDING_REVIEW
}

model CourseSkill {
  id       String @id @default(cuid())
  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  skill    SkillCategory
  weight   Float  // 0.0 - 1.0

  @@unique([courseId, skill])
}

enum SkillCategory {
  BACKEND
  FRONTEND
  DEVOPS
  DATABASES
  MOBILE
  TESTING
  WEB_FUNDAMENTALS
}

model CoursePrerequisite {
  id                   String @id @default(cuid())
  courseId             String
  course               Course @relation("CoursePrerequisites", fields: [courseId], references: [id])
  prerequisiteCourseId String
  prerequisite         Course @relation("PrerequisiteOf", fields: [prerequisiteCourseId], references: [id])
  type                 PrerequisiteType @default(REQUIRED)

  @@unique([courseId, prerequisiteCourseId])
}

enum PrerequisiteType {
  REQUIRED
  RECOMMENDED
}

model CatalogImport {
  id         String        @id @default(cuid())
  startedAt  DateTime      @default(now())
  finishedAt DateTime?
  source     ImportSource
  status     ImportStatus  @default(RUNNING)
  created    Int           @default(0)
  updated    Int           @default(0)
  errors     String?       // JSON array de errores
}

enum ImportSource {
  CSV
  SCRAPER
  MANUAL
}

enum ImportStatus {
  RUNNING
  SUCCESS
  FAILED
  PARTIAL
}

// ================================================================
// ASSESSMENTS — Cuestionario de evaluacion
// ================================================================

model Question {
  id       String   @id @default(cuid())
  text     String
  category SkillCategory
  order    Int
  active   Boolean  @default(true)

  options   QuestionOption[]
  answers   AssessmentAnswer[]
}

model QuestionOption {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  value      Int      // Puntaje que aporta al skill de la categoria (1-5)
  order      Int
}

model Assessment {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  version      Int      @default(1)
  completedAt  DateTime?
  createdAt    DateTime @default(now())

  // Perfil resultante calculado (JSON con scores por SkillCategory)
  // Ejemplo: { "BACKEND": 18, "FRONTEND": 12, "DEVOPS": 5 }
  profileScores Json?

  // Objetivo profesional declarado por el usuario
  goalCategory  SkillCategory?

  answers       AssessmentAnswer[]
  roadmaps      Roadmap[]
}

model AssessmentAnswer {
  id           String   @id @default(cuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  questionId   String
  question     Question @relation(fields: [questionId], references: [id])
  optionId     String?  // Si es opcion multiple
  freeText     String?  // Si es respuesta libre
  numericValue Int?     // Si es escala numerica

  @@unique([assessmentId, questionId])
}

// ================================================================
// ROADMAPS — Rutas de aprendizaje
// ================================================================

model Roadmap {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assessmentId     String?
  assessment       Assessment? @relation(fields: [assessmentId], references: [id])
  title            String
  goal             String?
  status           RoadmapStatus @default(ACTIVE)
  algorithmVersion String   @default("1.0")
  estimatedHours   Int?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  items            RoadmapItem[]
}

enum RoadmapStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

model RoadmapItem {
  id           String  @id @default(cuid())
  roadmapId    String
  roadmap      Roadmap @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  courseId     String
  course       Course  @relation(fields: [courseId], references: [id])
  order        Int
  reason       String  // Explicacion legible: "Incluido porque es base para NestJS"
  similarityScore Float? // Solo Camino B (vectores)

  progress     Progress?

  @@unique([roadmapId, courseId])
  @@unique([roadmapId, order])
}

// ================================================================
// PROGRESS — Progreso del usuario por curso
// ================================================================

model Progress {
  id            String     @id @default(cuid())
  roadmapItemId String     @unique
  roadmapItem   RoadmapItem @relation(fields: [roadmapItemId], references: [id], onDelete: Cascade)
  status        ProgressStatus @default(NOT_STARTED)
  percentage    Int        @default(0)  // 0 - 100
  startedAt     DateTime?
  completedAt   DateTime?
  updatedAt     DateTime   @updatedAt
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

---

## Notas del schema histórico

1. **Better Auth administra `User`, `Session`, `Account`, `Verification`.**
   No modificar la estructura de estas tablas. Solo agregar relaciones de negocio en `User`.

2. **`Assessment.profileScores` es un campo JSON.**
   Guardamos el mapa `{ BACKEND: 18, FRONTEND: 12 }` directamente. Esto evita tablas intermedias para el MVP
   y facilita la lectura y depuracion.

3. **`Roadmap.algorithmVersion`** permite que en el futuro cambies el algoritmo sin romper rutas existentes.
   Una ruta version "1.0" siempre se podra mostrar tal como fue generada.

4. **`RoadmapItem.reason`** es texto libre explicativo. Es el campo mas importante para la UX:
   el usuario debe entender por que un curso esta en su ruta.

5. **`Progress` es un record separado por `RoadmapItem`**, no por `Course`.
   Esto permite que el mismo curso en dos rutas distintas tenga estado de progreso independiente.

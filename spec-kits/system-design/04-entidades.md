# 04 — Modelo de Datos y Entidades

> **Fuente de verdad:** `backend/prisma/schema.prisma` y sus migraciones. La
> sección [Schema vigente](#schema-vigente-rutas-progreso-y-temario) reproduce
> los modelos de rutas, progreso y temario tal como están implementados. El
> bloque [histórico](#schema-de-prisma-histórico-no-vigente) se conserva solo
> como contexto de diseño: sus campos `Roadmap.status`,
> `Roadmap.algorithmVersion`, `Progress.id` y `Progress.status` **no existen**
> y no deben usarse en consultas, migraciones ni integraciones.

---

## Diagrama de Relaciones (texto)

```
User (Better Auth)
  |---< Assessment (1 usuario, N assessments)
  |       |---< AssessmentAnswer (1 assessment, N respuestas)
  |
  |---< Roadmap (1 usuario, N rutas; basada en un Assessment)
          |---< RoadmapItem (1 ruta, N items ordenados: COURSE, MEDIA o CHALLENGE)
                    |---> Course (solo items COURSE)
                    |---1 Progress (1 item, 1 registro de progreso)
                    |---< ChallengeSubmission (entregas de un reto)

Course
  |---< CourseSkill (tags/skills del curso)
  |---< CoursePrerequisite (prerequisitos del curso)
  |---< CourseLesson (temario: secciones y lecciones)

Question (banco de preguntas del cuestionario)
  |---< QuestionOption (opciones de respuesta)

CatalogImport (log de importaciones del catalogo)
```

---

## Schema vigente (rutas, progreso y temario)

```prisma
model Roadmap {
  id                        String        @id @default(cuid())
  userId                    String
  user                      User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  assessmentId              String
  assessment                Assessment    @relation(fields: [assessmentId], references: [id], onDelete: Restrict)
  title                     String
  summary                   String
  goal                      Json?
  weeklyHours               Decimal?      @db.Decimal(10, 2)
  generatorVersion          String
  catalogHash               String
  generationContextSnapshot Json
  pausedAt                  DateTime?     @db.Timestamptz(3)
  lastActivityAt            DateTime      @default(now()) @db.Timestamptz(3)
  activityVersion           Int           @default(0)
  createdAt                 DateTime      @default(now()) @db.Timestamptz(3)
  items                     RoadmapItem[]

  @@index([userId, createdAt, id])
  @@index([assessmentId])
  @@map("roadmap")
}

model RoadmapItem {
  id               String                @id @default(cuid())
  roadmapId        String
  roadmap          Roadmap               @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  type             RoadmapItemType
  courseId         String?
  course           Course?               @relation(fields: [courseId], references: [id], onDelete: Restrict)
  sourceKey        String
  order            Int
  name             String
  description      String?
  image            String?
  url              String?
  level            Int?
  estimatedMinutes Decimal?              @db.Decimal(10, 2)
  reason           String
  targetSkills     SkillCategory[]
  contentData      Json
  progress         Progress?
  submissions      ChallengeSubmission[]

  @@unique([roadmapId, order])
  @@unique([roadmapId, sourceKey])
  @@unique([roadmapId, courseId])
  @@index([courseId])
  @@map("roadmap_item")
}

enum RoadmapItemType {
  COURSE
  MEDIA
  CHALLENGE
}

model Progress {
  roadmapItemId String      @id
  roadmapItem   RoadmapItem @relation(fields: [roadmapItemId], references: [id], onDelete: Cascade)
  percentage    Float       @default(0)
  version       Int         @default(0)
  trackingState Json        @default("{}")
  startedAt     DateTime?   @db.Timestamptz(3)
  completedAt   DateTime?   @db.Timestamptz(3)
  updatedAt     DateTime    @updatedAt @db.Timestamptz(3)

  @@map("progress")
}

model ChallengeSubmission {
  id               String                    @id @default(cuid())
  roadmapItemId    String
  roadmapItem      RoadmapItem               @relation(fields: [roadmapItemId], references: [id], onDelete: Cascade)
  eventId          String?
  payloadHash      String?
  submissionType   ChallengeSubmissionType
  status           ChallengeSubmissionStatus @default(PENDING_REVIEW)
  content          String?
  language         String?
  url              String?
  storageKey       String?
  originalFilename String?
  mimeType         String?
  sizeBytes        Int?
  checksum         String?
  feedback         Json?
  evaluatorVersion String?
  reviewedByUserId String?
  reviewedByUser   User?                     @relation("ChallengeReviewer", fields: [reviewedByUserId], references: [id], onDelete: Restrict)
  createdAt        DateTime                  @default(now()) @db.Timestamptz(3)
  evaluatedAt      DateTime?                 @db.Timestamptz(3)

  @@unique([roadmapItemId, eventId])
  @@index([roadmapItemId, status, createdAt])
  @@index([reviewedByUserId])
  @@map("challenge_submission")
}

enum ChallengeSubmissionType {
  TEXT
  CODE
  LINK
  FILE
}

enum ChallengeSubmissionStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
}

model CourseLesson {
  id           String     @id @default(cuid())
  courseId     String
  course       Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  sectionOrder Int
  sectionTitle String
  order        Int
  title        String
  type         LessonType
  freePreview  Boolean    @default(false)

  @@unique([courseId, order])
  @@map("course_lesson")
}

enum LessonType {
  VIDEO
  TEXT
  OTHER
}
```

### Notas del schema vigente

1. **El estado y el porcentaje de la ruta no se guardan.** Se derivan de
   `Progress.percentage` de sus items y de `Roadmap.pausedAt`
   (promedio truncado a 2 decimales; `NOT_STARTED` solo si todo está en 0 y
   ningún item tiene `startedAt`, además de `IN_PROGRESS`, `PAUSED`, `COMPLETED`).
   El listado los calcula en SQL para filtrar y paginar en la base.
2. **`Progress` usa `roadmapItemId` como clave primaria** (uno por item) y no
   tiene `status`: guarda `percentage`, `version` para concurrencia,
   `trackingState` (posición de video, lecciones marcadas, última lección) y
   `startedAt`/`completedAt`.
3. **`RoadmapItem.contentData` es una instantánea inmutable**: skills,
   duración, política de tracking y, en cursos con temario, una copia de sus
   lecciones. Reimportar el catálogo no altera rutas existentes.
4. **`Roadmap.generatorVersion`** reemplaza al antiguo `algorithmVersion`
   (por ejemplo `rules-…` o `nvidia:<modelo>`), y
   `generationContextSnapshot` conserva el contexto con el que se generó.
5. **`ChallengeSubmission`** conserva cada intento de un reto; solo la
   aprobación de un administrador lleva el item a 100 %. `eventId` quedó de una
   versión anterior del contrato y ya no se usa (la deduplicación usa
   `payloadHash`).

---

## Schema de Prisma histórico (no vigente)

> Diseño previo a la implementación. No refleja la base actual; ver
> [Schema vigente](#schema-vigente-rutas-progreso-y-temario).

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

## Notas del schema histórico (contexto de diseño)

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

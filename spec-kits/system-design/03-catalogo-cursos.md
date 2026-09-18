# 03 — Catalogo de Cursos: Ingestion y Scraping

> Como obtenemos, normalizamos y almacenamos el catalogo de cursos de DevTalles.
> Dos estrategias: importacion CSV manual (MVP) y scraper como adaptador opcional.

---

## El problema

El sistema necesita un catalogo propio de cursos de DevTalles para generar rutas.
No depende de la disponibilidad de la web externa en tiempo real.
El catalogo se actualiza periodicamente, no en cada request.

---

## Estrategia 1: Importacion Manual por CSV (MVP — Recomendada para la hackathon)

### Flujo

```
DevTalles (web publica)
       |
       | Extraccion manual o semi-manual por el equipo
       v
courses.csv  [id, slug, title, url, description, level, tags, durationHours]
       |
       v
POST /api/v1/catalog/import  (endpoint admin, rol requerido)
       |
       v
NestJS: CatalogService.importFromCsv()
  - Lee filas del CSV
  - Normaliza tags a skills internas
  - Deduplica por slug o url
  - Inserta/actualiza en tabla Course
  - Registra CatalogImport (log de la operacion)
       |
       v
Base de datos: cursos disponibles para el generador de rutas
```

### Formato del CSV esperado

```csv
slug,title,url,description,level,tags,durationHours
nestjs-de-cero,NestJS de Cero a Experto,https://devtalles.com/...,Aprende NestJS...,intermediate,"nestjs,backend,typescript",20
react-pro,React Pro,https://devtalles.com/...,React avanzado...,advanced,"react,frontend,typescript",15
```

### Niveles de curso

| Valor en CSV | Nivel interno |
|--------------|---------------|
| `beginner` | 1 |
| `intermediate` | 2 |
| `advanced` | 3 |

### Tags normalizados a Skills internas

El importador convierte los tags del CSV a una lista fija de skills del sistema:

| Tag en CSV | Skill interna |
|-----------|---------------|
| `nestjs`, `express`, `node` | `backend` |
| `react`, `vue`, `angular` | `frontend` |
| `typescript`, `javascript` | `web-fundamentals` |
| `docker`, `kubernetes`, `ci-cd` | `devops` |
| `sql`, `postgresql`, `mongodb` | `databases` |
| `flutter`, `react-native` | `mobile` |
| `testing`, `jest`, `vitest` | `testing` |

> Esta tabla de normalizacion se puede guardar como constante en NestJS o como tabla en DB para hacerla configurable.

---

## Estrategia 2: Scraper como Adaptador Opcional

> Solo implementar si el equipo tiene autorizacion de DevTalles o si la extraccion publica es legal y factible.
> Encapsular como adaptador para que el contrato del catalogo no cambie.

### Verificar antes de implementar

1. Revisar `https://devtalles.com/robots.txt` — ver que rutas estan permitidas para bots
2. Revisar Terminos de Uso de DevTalles — confirmar si el scraping publico de metadatos esta permitido
3. Contactar a DevTalles — solicitar un feed oficial o permiso explcito

### Flujo del scraper (si se autoriza)

```
Job programado (NestJS @Cron o Bull Queue)
       |
       v
HTTP GET a pagina publica de cursos de DevTalles
  - User-Agent identificable: "CodeQuest-Bot/1.0 (+contacto@equipo.com)"
  - Rate limiting: max 1 request cada 5 segundos
  - Solo paginas publicas, sin sesion
       |
       v
Parseo de HTML (cheerio o puppeteer)
  Extraer: titulo, url, resumen, duracion, etiquetas visibles
       |
       v
Normalizacion (misma logica que el CSV)
       |
       v
Validacion:
  - Detectar campos vacios o cambios masivos inusuales
  - Si mas del 30% de cursos cambian en una sola corrida -> alerta, no publicar automaticamente
       |
       v
CatalogImport: guardar log (inicio, fin, resultado, conteos, errores)
       |
       v
Cursos en estado PENDING_REVIEW si hay dudas, ACTIVE si todo OK
```

### Patron Adaptador en NestJS

```typescript
// src/modules/catalog/ingestion/catalog-ingestion.interface.ts
export interface CatalogIngestionAdapter {
  fetchCourses(): Promise<RawCourse[]>;
}

// src/modules/catalog/ingestion/csv.adapter.ts
export class CsvCatalogAdapter implements CatalogIngestionAdapter {
  async fetchCourses(): Promise<RawCourse[]> {
    // Lee el CSV y retorna cursos crudos
  }
}

// src/modules/catalog/ingestion/scraper.adapter.ts  (opcional, Camino B del catalogo)
export class ScraperCatalogAdapter implements CatalogIngestionAdapter {
  async fetchCourses(): Promise<RawCourse[]> {
    // Hace scraping y retorna cursos crudos
  }
}

// catalog.service.ts usa el adaptador inyectado
// Si el dia de manana quieren cambiar de CSV a scraper, solo cambian el adaptador
```

---

## Entidades del Modulo Catalog

```
Course
  id            String   @id
  slug          String   @unique
  title         String
  url           String
  description   String?
  level         Int      (1=beginner, 2=intermediate, 3=advanced)
  durationHours Int?
  status        String   (ACTIVE | INACTIVE | PENDING_REVIEW)
  sourceUpdatedAt DateTime?
  createdAt     DateTime
  updatedAt     DateTime

  skills        CourseSkill[]
  prerequisites CoursePrerequisite[]

CourseSkill
  id       String
  courseId String -> Course
  skill    String  (backend | frontend | devops | databases | mobile | testing | web-fundamentals)
  weight   Float   (0.0 - 1.0, que tan representativo es este skill para el curso)

CoursePrerequisite
  courseId           String -> Course
  prerequisiteCourseId String -> Course
  type               String (REQUIRED | RECOMMENDED)

CatalogImport
  id        String
  startedAt DateTime
  finishedAt DateTime?
  source    String  (CSV | SCRAPER | MANUAL)
  status    String  (RUNNING | SUCCESS | FAILED | PARTIAL)
  created   Int     (cursos nuevos)
  updated   Int     (cursos modificados)
  errors    String? (JSON con lista de errores)
```

---

## Recomendacion 

1. **Semana 1**: Preparar el CSV con los cursos de DevTalles disponibles publicamente (titulo, URL, nivel, tags).
   El equipo puede hacer esto de forma manual revisando la web de DevTalles.
2. **Semana 1**: Implementar `CatalogService.importFromCsv()` y el endpoint admin.
3. **Semana 2+**: Si hay tiempo y autorizacion, agregar el adaptador de scraping.

El catalogo de cursos es el cimiento de todo. Sin el, no hay rutas ni cuestionario que tenga sentido.

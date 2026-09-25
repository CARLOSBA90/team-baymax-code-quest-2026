# 02 — Dos Caminos de Implementacion

> Dos propuestas completas de como abordar el desarrollo del sistema CodeQuest.
> Cada camino define prioridades, riesgos y forma de desarrollo.

---

## Camino A: Algoritmo Deterministico con Reglas Fijas

### Filosofia

El sistema genera rutas de aprendizaje usando **reglas explicitas y configurables** basadas en:
- Tags/Skills de los cursos (definidos manualmente o en el CSV de importacion)
- Respuestas del cuestionario mapeadas a un perfil de habilidades
- Un grafo de prerequisitos ordenado topologicamente

No se necesita IA ni ML. Las reglas son transparentes y explicables.

### Flujo general

```
Usuario completa cuestionario
         |
         v
Backend calcula perfil de habilidades (scores por categoria)
         |
         v
Motor de reglas filtra cursos del catalogo segun:
  - Objetivo (frontend, backend, movil, datos, DevOps)
  - Nivel declarado vs nivel del curso
  - Tags/Skills con mayor score
         |
         v
Ordenamiento topologico (prerequisitos primero)
         |
         v
Ruta generada con motivo legible por item
  ejemplo: "incluido porque es base para NestJS"
         |
         v
Se guarda ruta con version de algoritmo + snapshot del catalogo
```

### Ventajas

- Simple de implementar en el tiempo de una hackathon
- Resultados explicables: cada curso tiene un `reason` visible al usuario
- Facil de testear: mismo input => mismo output
- No requiere datos historicos para funcionar

### Desventajas

- Las reglas son rigidas: si el catalogo cambia mucho, las reglas hay que revisar
- No aprende de los usuarios: el sistema no mejora con el uso

### Modulos NestJS necesarios

```
assessments  -> recibe respuestas, computa AssessmentProfile
catalog      -> expone cursos con tags/skills/prerequisitos
roadmaps     -> RoadmapGeneratorService ejecuta el algoritmo de reglas
progress     -> actualiza estado de cada item de la ruta
```

### Entidades clave

```
AssessmentProfile  { userId, scores: { frontend: 7, backend: 3, ... } }
Course             { id, title, tags[], level, prerequisiteIds[] }
Roadmap            { id, userId, goal, algorithmVersion, items[] }
RoadmapItem        { courseId, order, reason, progress }
```

### Stack adicional recomendado

Ningun servicio externo requerido para el MVP. Toda la logica en NestJS puro.

---

## Camino B: Algoritmo Hibrido con Perfil Vectorizado + Matching por Similitud

### Filosofia

En lugar de solo reglas de puntuacion, el sistema **vectoriza** el perfil del usuario y los cursos, y hace un matching por similitud coseno. Esto permite que el sistema sea mas flexible y escalable hacia recomendaciones mas sofisticadas sin necesitar IA generativa.

### Flujo general

```
Usuario completa cuestionario
         |
         v
Backend construye vector del usuario: [frontend, backend, datos, devops, movil, testing]
  ejemplo: [0.8, 0.3, 0.1, 0.2, 0.0, 0.4]
         |
         v
Cada curso tiene su vector pre-calculado segun sus tags:
  NestJS Avanzado: [0.1, 0.9, 0.0, 0.3, 0.0, 0.1]
         |
         v
Motor calcula similitud coseno entre vector usuario y vector de cada curso
Score = dot(userVector, courseVector) / (|userVector| * |courseVector|)
         |
         v
Top-N cursos ordenados por similitud y ajustados por prerequisitos
         |
         v
Ruta generada con score de afinidad como "motivo"
  ejemplo: "85% de afinidad con tu perfil de backend"
         |
         v
Se guarda ruta con snapshot del vector y version del algoritmo
```

### Ventajas

- Mas flexible: agregar una nueva categoria de cursos no requiere cambiar reglas rigidas
- Escalable: el mismo contrato puede conectarse en el futuro a embeddings reales o un modelo ligero
- Los scores de afinidad son mas intuitivos para el usuario
- Compatible con un futuro A/B testing de algoritmos (el campo `algorithmVersion` en `Roadmap` ya lo soporta)

### Desventajas

- Mas complejo de implementar bien en tiempo limitado
- Requiere que los cursos tengan vectors pre-calculados (se puede hacer en seed/import)
- Los vectores en PostgreSQL no son tan eficientes como en una DB vectorial (pgvector puede ayudar)

### Modulos NestJS necesarios

```
assessments  -> construye UserVector a partir de respuestas
catalog      -> guarda CourseVector junto al curso
roadmaps     -> RoadmapGeneratorService hace el matching vectorial
progress     -> igual que en Camino A
```

### Entidades clave

```
UserVector    { userId, vector: number[] (6 dimensiones) }
CourseVector  { courseId, vector: number[] (6 dimensiones) }
Roadmap       { id, userId, algorithmVersion, items[] }
RoadmapItem   { courseId, order, similarityScore, reason, progress }
```

### Stack adicional opcional

- `pgvector` extension de PostgreSQL: permite almacenar y buscar vectores natively con Prisma
- Sin pgvector: calcular la similitud en memoria en NestJS (perfectamente viable para N < 200 cursos)

---

## Comparativa de los dos Caminos

| Criterio | Camino A (Reglas) | Camino B (Vectores) |
|----------|-------------------|---------------------|
| Complejidad de implementacion | Baja | Media |
| Velocidad de desarrollo en hackathon | Alta | Media |
| Resultados explicables | Si (por reglas) | Si (por score) |
| Escalabilidad futura | Media | Alta |
| Requiere datos historicos | No | No |
| Facilidad de testeo | Alta | Media |
| Necesita infra adicional | No | Opcional (pgvector) |

---

## Recomendacion 

**Comenzar con el Camino A y disenar el contrato de `RoadmapGeneratorService` pensando en el Camino B.**

Es decir:
- Implementar el Camino A (reglas) para que el MVP funcione rapidamente.
- El modulo `roadmaps` expone una interfaz `RoadmapGeneratorService` con un metodo `generate(profile, catalog)`.
- Si hay tiempo, reemplazar la implementacion interna de ese metodo con el algoritmo vectorial del Camino B.
- El contrato externo (API, DTOs, respuestas) no cambia entre los dos caminos.

Esto es lo que la propuesta tecnica original llama "dejar la interfaz detras de `LearningPathGenerator`".

---

## Siguiente paso segun el camino elegido

- [03 — Catalogo de Cursos](./03-catalogo-cursos.md): como obtenemos los cursos
- [04 — Entidades](./04-entidades.md): modelo de datos completo
- [05 — Algoritmo de Rutas](./05-algoritmo-rutas.md): implementacion detallada de cada camino

---

## Nota de Arquitectura: Generacion Automatica Inline (Implementado)

> **ACTUALIZADO 2026-09-25**

Independientemente del camino elegido (A o B), la **arquitectura canonica de CodeQuest**
es que la generacion del roadmap ocurre **de forma automatica e inline** dentro de
`AssessmentsService.submit()`, inmediatamente despues de persistir el Assessment.

### Por que esta decision

El diseno original en este documento asumia que el frontend haria una segunda llamada
explicita a `POST /api/v1/roadmaps/generate`. Esa segunda llamada **nunca fue implementada**
en el cliente, lo que resultaba en que los usuarios completaban el cuestionario
sin obtener ninguna ruta generada.

### Arquitectura actual

```
AssessmentsService.submit()
  └─> [HOOK INLINE] Resolver Roadmap
        ├─ Ya existe: roadmap.status = "EXISTS" (id: existingRoadmap.id)
        ├─ Exito al generar: roadmap.status = "GENERATED" (id: generatedRoadmap.id)
        └─ Fallo controlado: roadmap.status = "FAILED" (message: error.message)
            Assessment persiste en DB, respuesta 201 informa al cliente sin romper la request.
```

### Estado de POST /api/v1/roadmaps/generate

| Rol | Estado |
|---|---|
| Flujo del cuestionario (primario) | ❌ **Deprecado** — la ruta se autogenera inline en `submit()` |
| Reintento tras fallo o re-generacion manual con parametros | ✅ Disponible como endpoint secundario |

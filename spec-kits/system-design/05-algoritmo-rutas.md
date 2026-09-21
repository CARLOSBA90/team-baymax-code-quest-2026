# 05 — Algoritmo de Generacion de Rutas

> Dos implementaciones del algoritmo de generacion de rutas.
> Ambas comparten el mismo contrato externo (DTOs y API).
> El modulo `roadmaps` encapsula la logica detras de `RoadmapGeneratorService`.

---

## Contrato del Generador (comun a ambos caminos)

```typescript
// src/modules/roadmaps/roadmap-generator.interface.ts

export interface GenerateRoadmapInput {
  userId: string;
  assessmentId: string;
  profileScores: Record<string, number>; // { BACKEND: 18, FRONTEND: 12, ... }
  goalCategory: string;                  // "BACKEND" | "FRONTEND" | ...
  weeklyHours?: number;                  // Horas disponibles por semana
  maxCourses?: number;                   // Maximo de cursos en la ruta (default: 8)
}

export interface GenerateRoadmapOutput {
  title: string;
  goal: string;
  estimatedHours: number;
  algorithmVersion: string;
  items: GeneratedRoadmapItem[];
}

export interface GeneratedRoadmapItem {
  courseId: string;
  courseTitle: string;
  courseUrl: string;
  order: number;
  reason: string;           // Explicacion legible para el usuario
  similarityScore?: number; // Solo Camino B
}
```

---

## Camino A: Algoritmo de Reglas Deterministico

### Pseudocodigo paso a paso

```
funcion generarRuta(input: GenerateRoadmapInput, catalogo: Course[]):

  1. FILTRAR
     cursosDisponibles = catalogo.filter(c => c.status == ACTIVE)

  2. FILTRAR POR OBJETIVO
     cursosRelevantes = cursosDisponibles.filter(c =>
       c.skills.some(s => s.skill == input.goalCategory && s.weight >= 0.4)
     )

  3. CALCULAR AFINIDAD POR CURSO
     para cada curso en cursosRelevantes:
       score = 0
       para cada skill del curso:
         userScore = input.profileScores[skill.category] ?? 0
         score += skill.weight * userScore
       curso.affinity = score

  4. FILTRAR POR NIVEL
     nivelUsuario = calcularNivelUsuario(input.profileScores, input.goalCategory)
     // Si score > 15: nivel 2 (intermediate). Si > 25: nivel 3 (advanced).
     cursosAdecuados = cursosRelevantes.filter(c =>
       c.level <= nivelUsuario + 1  // Permitir un nivel de stretch
     )

  5. ORDENAR TOPOLOGICAMENTE (prerequisitos primero)
     grafo = construirGrafoPrerequisitos(cursosAdecuados)
     ordenTopologico = topologicalSort(grafo)
     // Si un prerequisito no esta en cursosAdecuados, agregarlo con orden prioritario

  6. LIMITAR RUTA
     rutaFinal = ordenTopologico.slice(0, input.maxCourses ?? 8)

  7. ASIGNAR RAZONES LEGIBLES
     para cada curso en rutaFinal:
       si esPrerequisito:
         reason = "Incluido como base necesaria para {cursoSiguiente.title}"
       si es el objetivo principal:
         reason = "Alineado directamente con tu objetivo en {goalCategory}"
       si es de otra categoria pero con alta afinidad:
         reason = "Complementa tu perfil con habilidades de {skill}"

  8. RETORNAR GenerateRoadmapOutput
```

### Implementacion en NestJS (esqueleto)

```typescript
// src/modules/roadmaps/services/roadmap-generator-rules.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  GenerateRoadmapInput,
  GenerateRoadmapOutput,
} from '../roadmap-generator.interface.js';

@Injectable()
export class RoadmapGeneratorRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(input: GenerateRoadmapInput): Promise<GenerateRoadmapOutput> {
    // 1. Obtener catalogo activo con skills y prerequisitos
    const catalog = await this.prisma.course.findMany({
      where: { status: 'ACTIVE' },
      include: { skills: true, prerequisites: true },
    });

    // 2. Filtrar por objetivo
    const relevant = catalog.filter((c) =>
      c.skills.some(
        (s) => s.skill === input.goalCategory && s.weight >= 0.4,
      ),
    );

    // 3. Calcular afinidad
    const scored = relevant.map((course) => ({
      ...course,
      affinity: this.calcAffinity(course.skills, input.profileScores),
    }));

    // 4. Filtrar por nivel y ordenar topologicamente
    const userLevel = this.calcUserLevel(input.profileScores, input.goalCategory);
    const suitable = scored
      .filter((c) => c.level <= userLevel + 1)
      .sort((a, b) => b.affinity - a.affinity);

    // 5. Ordenamiento topologico
    const ordered = this.topologicalSort(suitable);

    // 6. Limitar y asignar razones
    const items = ordered.slice(0, input.maxCourses ?? 8).map((c, i) => ({
      courseId: c.id,
      courseTitle: c.title,
      courseUrl: c.url,
      order: i + 1,
      reason: this.buildReason(c, input.goalCategory),
    }));

    return {
      title: `Ruta de ${input.goalCategory} personalizada`,
      goal: input.goalCategory,
      estimatedHours: items.reduce((sum, item) => {
        const course = catalog.find((c) => c.id === item.courseId);
        return sum + (course?.durationHours ?? 0);
      }, 0),
      algorithmVersion: '1.0-rules',
      items,
    };
  }

  private calcAffinity(skills: any[], scores: Record<string, number>): number {
    return skills.reduce((sum, s) => sum + s.weight * (scores[s.skill] ?? 0), 0);
  }

  private calcUserLevel(scores: Record<string, number>, goal: string): number {
    const score = scores[goal] ?? 0;
    if (score > 25) return 3;
    if (score > 15) return 2;
    return 1;
  }

  private topologicalSort(courses: any[]): any[] {
    // Implementacion de Kahn's algorithm
    // Ver: https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const inDegree = new Map(courses.map((c) => [c.id, 0]));
    
    for (const course of courses) {
      for (const prereq of course.prerequisites) {
        if (courseMap.has(prereq.prerequisiteCourseId)) {
          inDegree.set(course.id, (inDegree.get(course.id) ?? 0) + 1);
        }
      }
    }

    const queue = courses.filter((c) => (inDegree.get(c.id) ?? 0) === 0);
    const result: any[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const course of courses) {
        if (course.prerequisites.some((p: any) => p.prerequisiteCourseId === current.id)) {
          const newDegree = (inDegree.get(course.id) ?? 0) - 1;
          inDegree.set(course.id, newDegree);
          if (newDegree === 0) queue.push(course);
        }
      }
    }

    return result;
  }

  private buildReason(course: any, goal: string): string {
    const mainSkill = course.skills.sort((a: any, b: any) => b.weight - a.weight)[0];
    if (mainSkill?.skill === goal) {
      return `Alineado directamente con tu objetivo en ${goal.toLowerCase()}`;
    }
    return `Complementa tu perfil con habilidades de ${mainSkill?.skill?.toLowerCase() ?? 'desarrollo'}`;
  }
}
```

---

## Camino B: Algoritmo de Similitud Vectorial

### Concepto de vectores

Cada entidad (usuario y curso) se representa como un vector de 7 dimensiones,
una por cada SkillCategory:

```
Dimensiones: [BACKEND, FRONTEND, DEVOPS, DATABASES, MOBILE, TESTING, WEB_FUNDAMENTALS]

Usuario: [0.9, 0.3, 0.2, 0.5, 0.0, 0.4, 0.7]
Curso NestJS: [1.0, 0.1, 0.1, 0.2, 0.0, 0.2, 0.5]
Curso React: [0.1, 1.0, 0.0, 0.0, 0.0, 0.3, 0.6]
```

### Similitud Coseno

```
similitud(A, B) = dot(A, B) / (|A| * |B|)

donde:
  dot(A, B) = A[0]*B[0] + A[1]*B[1] + ... + A[6]*B[6]
  |A| = sqrt(A[0]^2 + A[1]^2 + ... + A[6]^2)

Resultado: valor entre 0 (sin relacion) y 1 (identico perfil)
```

### Como construir el vector del usuario desde el Assessment

```typescript
// El Assessment guarda profileScores: { BACKEND: 18, FRONTEND: 12, DEVOPS: 5 }
// Normalizar al rango [0, 1] dividiendo por el maximo posible (ej: 30 puntos por categoria)

function buildUserVector(profileScores: Record<string, number>): number[] {
  const MAX_SCORE = 30;
  const CATEGORIES = ['BACKEND', 'FRONTEND', 'DEVOPS', 'DATABASES', 'MOBILE', 'TESTING', 'WEB_FUNDAMENTALS'];
  return CATEGORIES.map((cat) => Math.min((profileScores[cat] ?? 0) / MAX_SCORE, 1.0));
}
```

### Como construir el vector de un curso desde sus CourseSkills

```typescript
function buildCourseVector(skills: CourseSkill[]): number[] {
  const CATEGORIES = ['BACKEND', 'FRONTEND', 'DEVOPS', 'DATABASES', 'MOBILE', 'TESTING', 'WEB_FUNDAMENTALS'];
  return CATEGORIES.map((cat) => {
    const skill = skills.find((s) => s.skill === cat);
    return skill?.weight ?? 0;
  });
}
```

### Flujo del algoritmo vectorial

```
1. Construir userVector desde assessment.profileScores
2. Para cada curso activo, recuperar courseVector (pre-calculado al importar)
3. Calcular similitud coseno(userVector, courseVector)
4. Filtrar por nivel (misma logica que Camino A)
5. Ordenar por similitud descendente
6. Ordenar topologicamente (prerequisitos primero)
7. Limitar a maxCourses
8. Asignar reason con el score: "87% de afinidad con tu perfil"
```

---

## Cual implementar primero?

**Implementar Camino A.** Es mas simple y rapido.
El contrato `RoadmapGeneratorService` permite intercambiar la implementacion sin cambiar la API ni los DTOs.

Cuando el Camino A funcione y haya tiempo, extraer la logica de scoring a `RoadmapGeneratorVectorService`
y cambiar la inyeccion en el modulo.

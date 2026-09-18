# 01 — Requerimientos del Brief (CODE QUEST 2026)

> Extraccion y analisis de los requerimientos obligatorios del brief oficial.

---

## Requerimientos Obligatorios

| # | Requerimiento | Modulo NestJS responsable |
|---|---------------|--------------------------|
| R1 | Cuestionario de evaluacion de habilidades e intereses | `assessments` |
| R2 | Generar rutas de aprendizaje dinamicas segun cursos de DevTalles | `roadmaps` |
| R3 | Guardar y generar multiples rutas por usuario | `roadmaps` |
| R4 | Marcar el progreso de la ruta de aprendizaje | `progress` |
| R5 | Inicio de sesion obligatorio con Discord (y email/password como alternativa) | `auth` |
| R6 | Usar tecnologia de los cursos de DevTalles (NestJS, React, PostgreSQL) | stack base |

---

## Preguntas que el Equipo Debe Confirmar

Estas preguntas surgieron del analisis del brief y la propuesta tecnica inicial:

1. El brief exige solo Discord o tambien email/password para el MVP?
   - **Recomendacion**: implementar ambos. Better Auth lo soporta sin esfuerzo adicional.

2. Tenemos autorizacion de DevTalles para extraer el catalogo de cursos?
   - **Recomendacion**: empezar con un CSV importado manualmente y preparar el scraper como adaptador opcional.

3. Que objetivos profesionales y categorias de cursos deben aparecer en la primera version del cuestionario?
   - Ver [06-cuestionario.md](./06-cuestionario.md) para propuesta de categorias.

4. El progreso es declarado manualmente por el usuario, o se espera integracion con el progreso real de DevTalles?
   - **Recomendacion para MVP**: progreso manual. Ver [07-progreso.md](./07-progreso.md).

---

## Lo que esta FUERA del alcance del MVP

- Recomendaciones por IA generativa o modelos entrenados
- Sincronizacion del progreso real dentro de la plataforma DevTalles
- Pagos, suscripciones, administracion de cursos de terceros
- Extraccion de contenido privado, lecciones completas o datos de estudiantes

---


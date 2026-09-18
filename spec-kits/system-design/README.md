# Spec-Kit: Diseno del Sistema — CodeQuest Learning Paths

> Documento de arquitectura conceptual y diseno del sistema para la hackathon DevTalles CODE QUEST 2026.
> Backend: NestJS (Monolito Modular). Frontend: React + Vite.

---

## Indice

1. [Requerimientos del Brief](./01-requerimientos.md)
2. [Dos Caminos de Implementacion](./02-dos-caminos.md)
3. [Catalogo de Cursos: Ingestion y Scraping](./03-catalogo-cursos.md)
4. [Modelo de Datos y Entidades](./04-entidades.md)
5. [Algoritmo de Generacion de Rutas](./05-algoritmo-rutas.md)
6. [Cuestionario y Evaluacion](./06-cuestionario.md)
7. [Progreso del Usuario](./07-progreso.md)
8. [Autenticacion con Better Auth](./08-auth.md)
9. [Plan de Desarrollo Paralelo (Backend + Frontend)](./09-plan-paralelo.md)
10. [Modelo de Flujo NestJS: Controller -> Service -> DB](./10-modelo-flujo-nestjs.md)

---

## Contexto del Proyecto

CodeQuest es un complemento para estudiantes suscritos a DevTalles. Su objetivo es facilitar el aprendizaje mediante:

- Cuestionario de diagnostico de habilidades e intereses
- Generacion dinamica de rutas de aprendizaje personalizadas
- Seguimiento del progreso por curso y por ruta
- Registro e inicio de sesion obligatorio con Discord (requerimiento del brief)

El backend se desarrolla en **NestJS como Monolito Modular**. La propuesta tecnica original mencionaba Spring Boot y Next.js, pero el stack del equipo es NestJS (backend) y React/Vite (frontend).

---

## Modulos del Backend (NestJS)

```
src/modules/
+-- auth/            -> Configuracion de Better Auth + Discord
+-- users/           -> Perfil, datos del usuario autenticado
+-- catalog/         -> Cursos de DevTalles, skills, prerequisitos
+-- assessments/     -> Preguntas, respuestas, perfil resultante
+-- roadmaps/        -> Generacion, almacenamiento y version de rutas
+-- progress/        -> Estado por curso, porcentaje, ruta activa
```

---

## Como leer este spec-kit

Los documentos estan ordenados por dependencia logica:

```
01 (Requerimientos)
   -> 02 (Elegir un camino)
      -> 03 (Catalogo: donde vienen los cursos)
      -> 04 (Entidades: que guardamos en DB)
      -> 05 (Algoritmo: como generamos rutas)
      -> 06 (Cuestionario: como preguntamos)
      -> 07 (Progreso: como registramos avance)
      -> 08 (Auth: como autenticamos)
         -> 09 (Plan paralelo: como trabajamos en equipo)
            -> 10 (Flujo NestJS: modelo tecnico de referencia)
```

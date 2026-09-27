# Spec-Kit: Diseno del Sistema — CodeQuest Learning Paths

Documento de arquitectura conceptual y diseno del sistema para la hackathon DevTalles CODE QUEST 2026.
Backend: NestJS (Monolito Modular). Frontend: React 19 + Vite.

---

## Indice

1. [Requerimientos del Brief](./01-requerimientos.md)
2. [Dos Caminos de Implementacion](./02-dos-caminos.md)
3. [Catalogo de Cursos: Ingestion](./03-catalogo-cursos.md)
4. [Modelo de Datos y Entidades](./04-entidades.md)
5. [Algoritmo de Generacion de Rutas](./05-algoritmo-rutas.md)
6. [Cuestionario y Evaluacion](./06-cuestionario.md)
7. [Progreso del Usuario](./07-progreso.md)

---

## Contexto del Proyecto

CodeQuest es un complemento para estudiantes suscritos a DevTalles. Su objetivo es facilitar el aprendizaje mediante:

- Cuestionario de diagnostico de habilidades e intereses
- Generacion dinamica de rutas de aprendizaje personalizadas a partir del catalogo de DevTalles
- Seguimiento del progreso por curso y por ruta
- Autenticacion con email/password y proveedores OAuth (Discord, Google, GitHub)

El backend se desarrolla en NestJS como Monolito Modular. El frontend en React 19 + Vite.

---

## Modulos del Backend (NestJS)

```
src/modules/
+-- auth/            -> Configuracion de Better Auth + Discord/Google/GitHub
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
      -> 03 (Catalogo: de donde vienen los cursos)
      -> 04 (Entidades: que guardamos en DB)
      -> 05 (Algoritmo: como generamos rutas)
      -> 06 (Cuestionario: como preguntamos y calculamos perfil)
         -> 07 (Progreso: como registramos el avance)
```

Para la configuracion tecnica de autenticacion, consultar el spec-kit [better-auth](../better-auth/README.md).

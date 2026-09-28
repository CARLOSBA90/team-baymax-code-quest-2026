# Spec-Kits — CodeQuest

Documentacion viva, guias de implementacion y datos de referencia para el equipo de desarrollo.

---

## Que son los Spec-Kits

Los spec-kits son paquetes de documentacion que concentran todo lo necesario para implementar una funcionalidad o configurar una parte del proyecto:

- Guias paso a paso con instrucciones detalladas
- Convenciones de nombrado, estructura y patrones
- Mocks y datos de referencia para desarrollo sin dependencias externas

---

## Indice

### 1. [System Design](./system-design/README.md)

Arquitectura conceptual del sistema para la hackathon. Incluye:

- Requerimientos del brief
- Modelo de datos y entidades
- Algoritmo de generacion de rutas de aprendizaje
- Flujo del cuestionario y calculo de perfil
- Seguimiento de progreso del usuario

### 2. [NestJS Scaffolding](./nestjs-scaffolding/README.md)

Convenciones de estructura y nombrado para el backend NestJS. Incluye:

- Estructura de carpetas del Monolito Modular
- Tablas de nombrado de clases, archivos y metodos
- Reglas de arquitectura (sin logica en controllers, DTOs siempre)
- Ejemplo completo de un resource CRUD listo para copiar y adaptar

### 3. [Better Auth](./better-auth/README.md)

Setup de autenticacion con Better Auth. Incluye:

- Configuracion del servidor NestJS (bodyParser: false, AuthModule.forRoot, CORS)
- Guard global y decoradores (@AllowAnonymous, @OptionalAuth)
- Proveedores OAuth: Discord, Google, GitHub
- Configuracion del cliente React (useSession, credentials: include)
- Tabla de errores comunes y como resolverlos

### 4. [Mocks](./mocks/README.md)

Datos mock para desarrollo independiente entre backend y frontend. Incluye:

- Respuestas de auth en JSON
- Documentacion de contratos de API (endpoints, envelopes, codigos de respuesta)
- Mock del cliente HTTP para el frontend
- Mock del contexto de autenticacion React

### 5. [Checklist](./checklist.md)

Estado de avance de tareas por area (backend y frontend). Ordenado por bloqueo y dependencia.

---

## Mapa de dependencias

```
system-design --> entender el dominio antes de implementar
       |
       v
nestjs-scaffolding --> estructura base del backend
       |
       v
better-auth --> AuthModule sobre la estructura base
       |
       v
mocks --> referencia de datos durante todo el desarrollo
```

---

## Como usar los Spec-Kits

1. Identificar que se va a implementar.
2. Leer el spec-kit correspondiente completo antes de escribir codigo.
3. Consultar `checklist.md` para conocer el estado actual de la tarea.
4. Usar los mocks como referencia de forma de datos y contratos de API.

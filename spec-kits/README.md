# Spec-Kits — CodeQuest

> Documentacion viva, guias de implementacion y mocks de referencia para el equipo de desarrollo.

---

## Que son los Spec-Kits?

Los **spec-kits** son paquetes de documentacion que contienen todo lo necesario para implementar una funcionalidad o configurar una parte del proyecto. Incluyen:

- Guias paso a paso — Instrucciones detalladas
- Codigo de ejemplo — Archivos listos para copiar/adaptar
- Mocks — Datos de prueba para desarrollo sin dependencias

---

## Indice de Spec-Kits

### 1. [NestJS Scaffolding](./nestjs-scaffolding/README.md)
Como crear y configurar el backend NestJS Modular desde cero siguiendo las convenciones del proyecto.
- Comandos del CLI
- Estructura de carpetas del Monolito Modular
- Ejemplo completo de un resource CRUD

### 2. [Better Auth](./better-auth/README.md)
Instructivo para implementar autenticacion con Better Auth en NestJS y React.
- Setup del servidor (NestJS)
- Configuracion de Discord OAuth (requerimiento de la hackathon)
- Setup del cliente (React)
- Decoradores y guards

### 3. [Mocks](./mocks/README.md)
Datos mock para desarrollo independiente de backend y frontend.
- Respuestas de API (JSON)
- Cliente API mock
- Mocks de contextos React

---

## Como usar los Spec-Kits?

1. Identifica que vas a implementar
2. Lee el spec-kit correspondiente completo antes de codear
3. Copia los archivos de ejemplo como base
4. Adapta el codigo a tu caso especifico
5. Consulta los mocks para entender la forma de los datos

---

## Mapa de Dependencias

```
nestjs-scaffolding --> Necesario antes de todo
        |
        v
  better-auth --> Necesario para el AuthModule
        |
        v
     mocks --> Util durante todo el desarrollo
```

> Tip: Empieza siempre por `nestjs-scaffolding` para entender la estructura base antes de pasar a Better Auth.

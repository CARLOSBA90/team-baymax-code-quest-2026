# 📘 Spec-Kits — CodeQuest

> Documentación viva, guías de implementación y mocks de referencia para el equipo de desarrollo.

---

## ¿Qué son los Spec-Kits?

Los **spec-kits** son paquetes de documentación que contienen todo lo necesario para implementar una funcionalidad o configurar una parte del proyecto. Incluyen:

- 📖 **Guías paso a paso** — Instrucciones detalladas
- 💻 **Código de ejemplo** — Archivos listos para copiar/adaptar
- 🧪 **Mocks** — Datos de prueba para desarrollo sin dependencias

---

## 📂 Índice de Spec-Kits

### 1. [NestJS Scaffolding](./nestjs-scaffolding/README.md)
Cómo crear un backend NestJS desde cero siguiendo las convenciones del proyecto.
- Comandos del CLI
- Estructura de carpetas recomendada
- Ejemplo completo de un resource CRUD (`tasks`)

### 2. [Better Auth](./better-auth/README.md)
Instructivo para implementar autenticación con Better Auth en NestJS y React.
- Setup del servidor (NestJS)
- Setup del cliente (React)
- Decoradores y guards

### 3. [Mocks](./mocks/README.md)
Datos mock para desarrollo independiente de backend y frontend.
- Respuestas de API (JSON)
- Mocks de contextos React
- Cliente API mock

---

## 🎯 ¿Cómo usar los Spec-Kits?

1. **Identifica** qué vas a implementar
2. **Lee** el spec-kit correspondiente completo antes de codear
3. **Copia** los archivos de ejemplo como base
4. **Adapta** el código a tu caso específico
5. **Consulta** los mocks para entender la forma de los datos

---

## 🗺 Mapa de Dependencias

```
nestjs-scaffolding ──→ Necesario antes de todo
        │
        ▼
  better-auth ──→ Necesario para auth-api
        │
        ▼
     mocks ──→ Útil durante todo el desarrollo
```

> 💡 **Tip:** Empieza siempre por `nestjs-scaffolding` para entender la estructura base antes de pasar a Better Auth.

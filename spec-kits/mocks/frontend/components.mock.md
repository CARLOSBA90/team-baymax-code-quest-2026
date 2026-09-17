# 🧩 Guía de Uso de Mocks — Frontend React

> Cómo usar los mocks disponibles para desarrollar componentes sin depender del backend.

---

## 📋 Mocks Disponibles

| Archivo | Propósito |
|---------|-----------|
| `auth-context.mock.tsx` | Simular estados de autenticación en tests y storybook |
| `api-client.mock.ts` | Reemplazar llamadas a la API con datos fake + latencia simulada |

---

## 🔐 Mock de Auth Context

### Caso 1: Testear un componente con usuario autenticado

```tsx
import { render, screen } from '@testing-library/react';
import { MockAuthProvider, mockSession } from '@/mocks/auth-context.mock';
import { UserProfile } from '@/components/UserProfile';

test('muestra el nombre del usuario autenticado', () => {
  render(
    <MockAuthProvider session={mockSession.authenticated}>
      <UserProfile />
    </MockAuthProvider>
  );

  expect(screen.getByText('Carlos Pérez')).toBeInTheDocument();
});
```

### Caso 2: Testear componente sin sesión

```tsx
test('muestra mensaje de login cuando no hay sesión', () => {
  render(
    <MockAuthProvider session={mockSession.unauthenticated}>
      <UserProfile />
    </MockAuthProvider>
  );

  expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
});
```

### Caso 3: Testear estado de carga

```tsx
test('muestra skeleton mientras carga', () => {
  render(
    <MockAuthProvider session={null} isPending={true}>
      <UserProfile />
    </MockAuthProvider>
  );

  expect(screen.getByText('Cargando...')).toBeInTheDocument();
});
```

### Caso 4: Testear con usuario no verificado

```tsx
test('muestra alerta de verificación de email', () => {
  render(
    <MockAuthProvider session={mockSession.unverified}>
      <UserProfile />
    </MockAuthProvider>
  );

  expect(screen.getByText('Verifica tu email')).toBeInTheDocument();
});
```

---

## 📡 Mock de API Client

### Uso básico: Obtener tareas

```tsx
import { mockApiClient } from '@/mocks/api-client.mock';

// En tu componente o hook
async function loadTasks() {
  const response = await mockApiClient.tasks.findAll();
  console.log(response.data);  // Array de tareas
  console.log(response.meta);  // { total, page, limit, totalPages }
}
```

### Uso con TanStack Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApiClient } from '@/mocks/api-client.mock';

// Hook para listar tareas
function useTasks(page = 1) {
  return useQuery({
    queryKey: ['tasks', page],
    queryFn: () => mockApiClient.tasks.findAll(page),
  });
}

// Hook para crear tarea
function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockApiClient.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Uso en componente
function TaskList() {
  const { data, isLoading } = useTasks();
  const createTask = useCreateTask();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {data?.data.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <span>{task.status}</span>
        </div>
      ))}

      <button onClick={() => createTask.mutate({
        title: 'Nueva tarea',
        priority: 'HIGH',
      })}>
        Agregar Tarea
      </button>
    </div>
  );
}
```

---

## 🔄 Cambiar entre Mock y API Real

Patrón recomendado para switchear fácilmente entre mocks y API real:

```typescript
// src/lib/api.ts
import { mockApiClient } from '@/mocks/api-client.mock';
import { realApiClient } from '@/lib/api-client'; // Tu cliente real

// Usar variable de entorno para decidir
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const api = USE_MOCKS ? mockApiClient : realApiClient;
```

```bash
# .env.development
VITE_USE_MOCKS=true

# .env.production
VITE_USE_MOCKS=false
```

Así en tus componentes siempre importas de `@/lib/api` y el switch es transparente:

```tsx
import { api } from '@/lib/api';

const tasks = await api.tasks.findAll();
```

---

## 📚 Datos Mock Disponibles

### Usuarios (`mockUsers`)

| Key | Nombre | Email | Verificado |
|-----|--------|-------|------------|
| `carlos` | Carlos Pérez | carlos@example.com | ✅ |
| `maria` | María García | maria@example.com | ✅ |
| `unverified` | Juan López | juan@example.com | ❌ |

### Tareas (5 tareas mock)

| ID | Título | Status | Prioridad |
|----|--------|--------|-----------|
| `tsk_001` | Configurar Better Auth | COMPLETED | HIGH |
| `tsk_002` | Implementar CRUD de proyectos | IN_PROGRESS | HIGH |
| `tsk_003` | Diseñar esquema de notificaciones | PENDING | MEDIUM |
| `tsk_004` | Agregar tests e2e | PENDING | LOW |
| `tsk_005` | Configurar Docker Compose | CANCELLED | MEDIUM |

---

## 💡 Tips

1. **Simula latencia**: El `api-client.mock.ts` ya incluye delays realistas (200-800ms)
2. **Errores**: Puedes forzar errores pasando IDs inexistentes (ej: `tasks.findOne('invalid')`)
3. **Storybook**: Los mocks son perfectos para stories
4. **No commitear datos reales**: Los mocks usan datos ficticios a propósito

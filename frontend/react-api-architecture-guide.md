# Guía de arquitectura API — React + TypeScript

## Objetivo

Extender la aplicación React existente para incorporar:

- Un cliente HTTP basado en Axios.
- Tipado genérico de respuestas HTTP.
- Una capa de services para encapsular los endpoints de la API.
- Una capa de queries/mutations basada en TanStack Query.
- Mantener separadas las responsabilidades entre UI, estado remoto y acceso HTTP.
- Conservar la estructura actual de la aplicación sin migrarla a una arquitectura feature-based.

La arquitectura objetivo debe seguir este flujo:

```text
Component
    ↓
TanStack Query hook
    ↓
Service
    ↓
Axios client
    ↓
REST API
```

---

## 1. Estructura objetivo

Partiendo de la estructura existente:

```text
frontend/
├── README.md
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   └── ui/
│   ├── pages/
│   │   └── auth/
│   ├── router/
│   └── schemas/
```

Agregar la siguiente estructura:

```text
frontend/
├── README.md
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── assessment.service.ts
│   │   │   └── ...
│   │   │
│   │   └── queries/
│   │       ├── auth/
│   │       │   ├── useLogin.ts
│   │       │   └── useRegister.ts
│   │       │
│   │       ├── assessment/
│   │       │   └── useAssessment.ts
│   │       │
│   │       └── ...
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── pages/
│   │   └── auth/
│   │
│   ├── router/
│   │
│   ├── schemas/
│   │
│   ├── types/
│   │
│   └── main.tsx
```

No crear una estructura `features/` ni migrar los componentes existentes a una arquitectura feature-based.

---

# 2. Principios arquitectónicos

La implementación debe respetar estas reglas.

## 2.1 Components

Los componentes de React no deben realizar llamadas HTTP directamente.

No hacer:

```tsx
axios.get("/users");
```

ni:

```tsx
fetch("/users");
```

dentro de componentes.

Los componentes deben consumir hooks de TanStack Query:

```tsx
const { data, isPending, error } = useUsers();
```

---

## 2.2 Queries

La carpeta `api/queries` contiene hooks relacionados con TanStack Query.

Estos hooks son responsables de:

- `useQuery`
- `useMutation`
- cache
- invalidación de queries
- estados de loading
- errores
- refetch
- query keys

Los hooks no deben implementar directamente los detalles HTTP.

Ejemplo:

```ts
export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  });
}
```

---

## 2.3 Services

Los services encapsulan la comunicación con los endpoints de la API.

Un service:

- conoce las URLs de los endpoints;
- conoce los métodos HTTP;
- recibe los payloads necesarios;
- devuelve datos tipados;
- no debe importar React;
- no debe utilizar hooks de TanStack Query.

Ejemplo:

```ts
export const authService = {
  login(payload: LoginPayload) {
    return post<LoginResponse, LoginPayload>(
      "/auth/login",
      payload,
    );
  },
};
```

---

## 2.4 Axios client

Todo acceso HTTP debe pasar por `api/client.ts`.

Esto permite centralizar posteriormente:

- `baseURL`;
- headers;
- autenticación;
- interceptores;
- manejo de errores;
- refresh tokens;
- timeouts;
- configuración común.

No crear instancias de Axios dentro de los services.

---

# 3. Dependencias

Instalar las dependencias necesarias:

```bash
pnpm add axios @tanstack/react-query
```

Si TanStack Query todavía no está configurado en la aplicación, también debe configurarse `QueryClient` y `QueryClientProvider`.

No instalar librerías adicionales si no son necesarias para cumplir esta arquitectura.

---

# 4. Cliente Axios

Crear:

```text
src/api/client.ts
```

Debe existir una instancia centralizada de Axios.

Ejemplo inicial:

```ts
import axios, {
  type AxiosRequestConfig,
} from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function request<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  const response = await client.request<T>(config);

  return response.data;
}
```

La API debe devolver directamente `response.data`.

Esto permite que los services trabajen directamente con el tipo de respuesta:

```ts
const response = await request<User>({
  method: "GET",
  url: "/users/123",
});
```

El resultado será:

```ts
User
```

y no:

```ts
AxiosResponse<User>
```

---

# 5. Helpers HTTP genéricos

Se pueden crear helpers para simplificar los services.

Por ejemplo:

```ts
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.get<T>(url, config);

  return response.data;
}
```

Para POST:

```ts
export async function post<TResponse, TBody>(
  url: string,
  data: TBody,
): Promise<TResponse> {
  const response = await client.post<TResponse>(
    url,
    data,
  );

  return response.data;
}
```

Pueden crearse también:

```text
get
post
put
patch
delete
```

No crear abstracciones más complejas hasta que exista una necesidad real.

---

# 6. Variables de entorno

Utilizar:

```text
VITE_API_URL
```

Ejemplo:

```env
VITE_API_URL=http://localhost:3000/api
```

No hardcodear la URL de la API dentro de los services.

Si existe un archivo `.env.example`, agregar:

```env
VITE_API_URL=
```

Nunca agregar credenciales reales al repositorio.

---

# 7. Services

Crear:

```text
src/api/services/
```

Cada dominio de API debe tener su propio service.

Por ejemplo:

```text
services/
├── auth.service.ts
├── assessment.service.ts
└── ...
```

## Ejemplo: Auth

```ts
import { post } from "../client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  login(payload: LoginPayload) {
    return post<LoginResponse, LoginPayload>(
      "/auth/login",
      payload,
    );
  },

  register(payload: RegisterPayload) {
    return post<RegisterResponse, RegisterPayload>(
      "/auth/register",
      payload,
    );
  },
};
```

Las interfaces/types específicos pueden mantenerse en el service inicialmente o moverse a `src/types/` cuando sean reutilizados por varias partes de la aplicación.

---

# 8. Tipos

Crear:

```text
src/types/
```

Usar esta carpeta para tipos compartidos entre diferentes capas.

Ejemplo:

```text
types/
├── auth.ts
├── assessment.ts
└── ...
```

No duplicar interfaces entre components, services y queries.

Si un tipo es utilizado únicamente por un service y no tiene valor fuera de él, puede permanecer junto al service.

Si comienza a ser utilizado por múltiples módulos, moverlo a `src/types/`.

---

# 9. TanStack Query

Configurar TanStack Query en el punto de entrada de la aplicación.

Crear un `QueryClient`:

```ts
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();
```

Y envolver la aplicación:

```tsx
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

La configuración debe permanecer simple inicialmente.

No definir políticas globales de cache, retry o stale time excesivamente específicas sin una necesidad concreta de la aplicación.

---

# 10. Queries y mutations

Crear:

```text
src/api/queries/
```

Organizar por dominio:

```text
queries/
├── auth/
│   ├── useLogin.ts
│   └── useRegister.ts
│
├── assessment/
│   └── useAssessment.ts.ts
│
└── ...
```

Usar `useQuery` para obtener datos y `useMutation` para operaciones que modifican datos.

---

## 10.1 Login

Login es una mutation.

```ts
import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  });
}
```

Uso:

```tsx
const {
  mutate,
  isPending,
  error,
  data,
} = useLogin();

mutate({
  email,
  password,
});
```

---

## 10.2 Register

Register también es una mutation:

```ts
import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";

export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
  });
}
```

---

# 11. Query keys

Cuando existan queries de lectura, utilizar query keys consistentes.

Por ejemplo:

```ts
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) =>
    [...userKeys.details(), id] as const,
};
```

No es necesario crear un sistema complejo de query keys para las primeras queries.

Pero las keys deben ser estables y evitar strings duplicados dispersos por la aplicación.

---

# 12. Schemas

Mantener la carpeta existente:

```text
src/schemas/
```

Los schemas deben encargarse de validación de datos.

Si se utiliza Zod:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginFormData =
  z.infer<typeof loginSchema>;
```

Los schemas no deben realizar llamadas HTTP.

La validación del formulario y el acceso a la API son responsabilidades diferentes.

---

# 13. Flujo completo de autenticación

La implementación de login debe seguir esta arquitectura:

```text
LoginPage
    ↓
LoginForm
    ↓
useLogin()
    ↓
authService.login()
    ↓
post<LoginResponse, LoginPayload>()
    ↓
Axios
    ↓
POST /auth/login
```

El componente debe conocer únicamente la interfaz del hook:

```ts
const login = useLogin();

login.mutate(payload);
```

No debe conocer Axios ni la URL del endpoint.

---

# 14. Manejo de errores

El cliente HTTP debe centralizar el comportamiento común de Axios.

Inicialmente puede limitarse a devolver los errores de Axios para que TanStack Query los exponga.

No implementar todavía una arquitectura compleja de errores si la aplicación no la necesita.

Posteriormente puede agregarse:

- Axios response interceptor;
- normalización de errores;
- refresh token;
- logout automático ante `401`;
- manejo global de errores.

Estas funcionalidades deben agregarse en `api/client.ts` o en módulos relacionados con la infraestructura HTTP, no dentro de los componentes.

---

# 15. Autenticación

Si el login devuelve un token:

```ts
interface LoginResponse {
  accessToken: string;
  user: User;
}
```

La lógica relacionada con almacenar y recuperar el token debe mantenerse separada del componente.

Por ejemplo, posteriormente se puede introducir:

```text
src/
├── api/
│   └── client.ts
│
├── auth/
│   ├── auth-storage.ts
│   └── ...
```

o una abstracción equivalente.

El Axios client podrá utilizar posteriormente un interceptor para añadir:

```http
Authorization: Bearer <token>
```

No implementar almacenamiento de tokens hasta conocer el mecanismo de autenticación definido por el backend.

---

# 16. Reglas de dependencia

Respetar estas reglas:

```text
components
    ↓
queries
    ↓
services
    ↓
client
```

Permitido:

```text
Component → Query
Query → Service
Service → Client
```

Evitar:

```text
Component → Axios
Component → Service
Service → React
Service → TanStack Query
Schema → Axios
Client → Component
```

Especialmente importante:

**Los components no deben llamar directamente a los services.**

La intención es que TanStack Query sea la capa que gestione el estado remoto.

---

# 17. Convenciones de nombres

Usar:

```text
*.service.ts
```

para services.

Ejemplos:

```text
auth.service.ts
assessment.service.ts
roadmaps.service.ts
```

Usar:

```text
use*.ts
```

para hooks de TanStack Query.

Ejemplos:

```text
useLogin.ts
useRegister.ts
useAssessment.ts
useRoadMaps.ts
useUpdateRoadMap.ts
```

Usar nombres de dominio consistentes:

```text
auth
assessment
roadmaps
```

Evitar nombres genéricos como:

```text
api.service.ts
request.service.ts
data.service.ts
helpers.ts
```

cuando el archivo pertenece claramente a un dominio.

---

# 18. Qué NO hacer

No crear:

```text
src/
├── services/
├── requests/
├── api/
├── http/
├── axios/
```

todos al mismo tiempo.

Esto fragmentaría innecesariamente la arquitectura.

La recomendación es centralizar:

```text
api/
├── client.ts
├── services/
└── queries/
```

Tampoco crear una carpeta diferente para cada endpoint.

No hacer:

```text
services/
├── auth/
│   ├── login.ts
│   └── register.ts
```

mientras el dominio siga siendo pequeño.

Es preferible:

```text
services/
└── auth.service.ts
```

---

# 19. Criterios para agregar nuevas entidades

Cuando aparezca una nueva entidad, seguir este proceso.

Por ejemplo, `assessment`.

### Paso 1 — Types

Si son compartidos:

```text
src/types/roadmaps.ts
```

### Paso 2 — Service

```text
src/api/services/roadmaps.service.ts
```

### Paso 3 — Queries

```text
src/api/queries/roadmaps/
├── useRoadMaps.ts
├── useRoadMap.ts
├── useCreateRoadMap.ts
├── useUpdateRoadMap.ts
└── useDeleteRoadMap.ts
```

### Paso 4 — Schemas

Si existen formularios o validaciones:

```text
src/schemas/roadmaps/
├── createRoadMap.schema.ts
└── updateRoadMap.schema.ts
```

### Paso 5 — Components

Los componentes utilizan los hooks:

```tsx
const { data, isPending } = useRoadMaps();
```

No realizan llamadas HTTP directamente.

---

# 20. Orden recomendado de implementación

La IA debe implementar los cambios en este orden:

### 1. Revisar la aplicación existente

Antes de modificar archivos:

- identificar entry point;
- revisar `main.tsx`;
- revisar router;
- identificar si TanStack Query ya está instalado;
- identificar si Axios ya está instalado;
- revisar cómo están definidos actualmente los tipos;
- revisar cómo se manejan variables de entorno.

No sobrescribir configuraciones existentes sin verificar su propósito.

### 2. Instalar dependencias

Agregar únicamente las dependencias necesarias:

```bash
pnpm add axios @tanstack/react-query
```

### 3. Crear Axios client

Crear:

```text
src/api/client.ts
```

Configurar:

- `baseURL`;
- headers comunes;
- función genérica `request<T>`;
- helpers HTTP únicamente si aportan claridad.

### 4. Configurar TanStack Query

Configurar:

```text
QueryClient
QueryClientProvider
```

en el entry point apropiado.

### 5. Crear services

Crear:

```text
src/api/services/auth.service.ts
```

Implementar inicialmente:

```text
login
register
```

según los endpoints reales disponibles.

No inventar endpoints, payloads ni respuestas.

### 6. Crear queries/mutations

Crear:

```text
src/api/queries/auth/useLogin.ts
src/api/queries/auth/useRegister.ts
```

### 7. Integrar con los componentes existentes

Actualizar los componentes de autenticación para consumir los hooks de TanStack Query.

Los componentes deben dejar de realizar llamadas HTTP directamente, si actualmente lo hacen.

### 8. Verificar TypeScript

Ejecutar el comando de typecheck definido por el proyecto.

Por ejemplo:

```bash
pnpm typecheck
```

Corregir todos los errores introducidos por la implementación.

### 9. Verificar lint/format

Ejecutar los comandos existentes del proyecto, por ejemplo:

```bash
pnpm lint
```

y/o:

```bash
pnpm check
pnpm typecheck
```

No modificar reglas de linting globales salvo que sea estrictamente necesario.

---

# 21. Checklist final

Antes de considerar terminada la implementación, verificar:

- [ ] Axios está instalado.
- [ ] TanStack Query está instalado.
- [ ] Existe un único Axios client centralizado.
- [ ] `VITE_API_URL` se utiliza para configurar `baseURL`.
- [ ] Existe `request<T>()` o una abstracción equivalente.
- [ ] Los services no importan React.
- [ ] Los services no utilizan TanStack Query.
- [ ] Los components no importan Axios.
- [ ] Los components no realizan llamadas HTTP directamente.
- [ ] Los components consumen hooks de TanStack Query.
- [ ] Login utiliza `useMutation`.
- [ ] Register utiliza `useMutation`.
- [ ] Los endpoints están encapsulados en `services/`.
- [ ] Los tipos reutilizables están centralizados en `types/`.
- [ ] Los schemas permanecen separados de la capa HTTP.
- [ ] La arquitectura no introduce `features/`.
- [ ] No se crean abstracciones innecesarias.
- [ ] TypeScript no presenta errores.
- [ ] Linting y formatting pasan correctamente.

---

# 22. Resultado esperado

La arquitectura final debe permitir que un componente tenga una implementación sencilla como:

```tsx
function LoginForm() {
  const login = useLogin();

  const handleSubmit = (data: LoginPayload) => {
    login.mutate(data);
  };

  // UI...
}
```

Mientras que la implementación HTTP permanece aislada:

```text
LoginForm
    ↓
useLogin
    ↓
authService.login
    ↓
post<LoginResponse, LoginPayload>
    ↓
Axios
    ↓
API
```

El objetivo principal es mantener una separación clara de responsabilidades y permitir que la aplicación crezca sin convertir los componentes en una mezcla de UI, lógica de negocio, estado remoto y acceso HTTP.

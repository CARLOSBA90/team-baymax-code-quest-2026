# Better Auth — Setup Frontend (React)

> Guia para configurar el cliente de Better Auth en el frontend React.
> Incluye inicio de sesion con Discord.

---

## Paso 1: Instalar Dependencias

```bash
cd frontend

# Better Auth incluye el cliente de React
pnpm add better-auth
```

> El paquete `better-auth` incluye `better-auth/react` con hooks optimizados para React.

---

## Paso 2: Crear el Cliente de Auth

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // URL base del backend (un solo endpoint)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Exportar hooks y funciones para uso directo
export const {
  useSession,   // Hook reactivo para obtener la sesion
  signIn,       // Funciones de inicio de sesion
  signOut,      // Cerrar sesion
  signUp,       // Registro
} = authClient;
```

---

## Paso 3: Usar en Componentes

### 3.1 — Hook `useSession`

```tsx
// src/components/UserProfile.tsx
import { useSession } from '@/lib/auth-client';

export function UserProfile() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <div className="animate-pulse">Cargando...</div>;
  }

  if (!session) {
    return (
      <div>
        <p>No has iniciado sesion</p>
        <a href="/login">Iniciar sesion</a>
      </div>
    );
  }

  return (
    <div>
      <h2>Bienvenido, {session.user.name}</h2>
      <p>Email: {session.user.email}</p>
      {session.user.image && (
        <img src={session.user.image} alt="Avatar" />
      )}
    </div>
  );
}
```

### 3.2 — Boton de Login con Discord (requerimiento del brief)

```tsx
// src/components/SignInWithDiscord.tsx
import { signIn } from '@/lib/auth-client';

export function SignInWithDiscord() {
  const handleDiscordLogin = async () => {
    await signIn.social({
      provider: 'discord',
      callbackURL: '/dashboard', // A donde redirigir tras autenticacion exitosa
    });
  };

  return (
    <button onClick={handleDiscordLogin}>
      Iniciar sesion con Discord
    </button>
  );
}
```

### 3.3 — Formulario de Login con Email

```tsx
// src/components/LoginForm.tsx
import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn.email({
        email,
        password,
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Email o contrasena incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar Sesion</h1>

      {error && <div className="error">{error}</div>}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
```

### 3.4 — Formulario de Registro

```tsx
// src/components/RegisterForm.tsx
import { useState } from 'react';
import { signUp } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';

export function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Error al registrar. Intenta con otro email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear Cuenta</h1>

      {error && <div className="error">{error}</div>}

      <div>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Crear Cuenta'}
      </button>
    </form>
  );
}
```

### 3.5 — Boton de Logout

```tsx
// src/components/LogoutButton.tsx
import { signOut } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';

export function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout}>
      Cerrar Sesion
    </button>
  );
}
```

---

## Paso 4: Proteger Rutas

### Componente ProtectedRoute

```tsx
// src/components/ProtectedRoute.tsx
import { useSession } from '@/lib/auth-client';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export function ProtectedRoute({
  children,
  fallback = '/login',
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
```

### Uso en el Router

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas publicas */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Paso 5: Consumir APIs del Backend

Cuando hagas requests al backend, necesitas enviar las cookies de sesion:

```typescript
// src/lib/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

/**
 * Fetch wrapper que envia cookies automaticamente
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Necesario para enviar cookies de sesion
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Ejemplos de uso:
// const profile = await apiFetch('/users/me');
// const roadmaps = await apiFetch('/roadmaps');
// const assessment = await apiFetch('/assessments', { method: 'POST', body: JSON.stringify(data) });
```

---

## Variables de Entorno del Frontend

```bash
# frontend/.env.development
VITE_API_URL=http://localhost:3001

# frontend/.env.production
VITE_API_URL=https://tu-api.onrender.com
```

---

## Checklist

- [ ] Instalar `better-auth` en el frontend
- [ ] Crear `src/lib/auth-client.ts` con `baseURL` apuntando al backend
- [ ] Implementar `SignInWithDiscord` con `signIn.social({ provider: 'discord' })`
- [ ] Implementar `LoginForm` con `signIn.email()`
- [ ] Implementar `RegisterForm` con `signUp.email()`
- [ ] Implementar `LogoutButton` con `signOut()`
- [ ] Crear `ProtectedRoute` con `useSession()`
- [ ] Configurar rutas protegidas en el router
- [ ] Crear `src/lib/api-client.ts` con `credentials: 'include'`
- [ ] Verificar variables de entorno (`VITE_API_URL`)

---

## Errores Comunes

| Error | Causa | Solucion |
|-------|-------|----------|
| `useSession` siempre null | Cookie no enviada | Verificar `credentials: 'include'` y CORS del backend |
| CORS error en signIn | Backend no tiene CORS correcto | Agregar frontend URL a `trustedOrigins` y `enableCors()` |
| Redirect loop | ProtectedRoute sin loading state | Agregar check de `isPending` antes de redirigir |
| `createAuthClient` falla | baseURL incorrecto | Verificar `VITE_API_URL` en `.env` y que apunte al backend |
| Discord redirige a error | callbackURL no configurado | Verificar que `callbackURL` en `signIn.social()` sea una ruta valida del frontend |

---

## Recursos

- [Setup Backend](./setup-backend.md)
- [Mocks de Frontend](../mocks/frontend/)
- [Documentacion Better Auth React](https://www.better-auth.com/docs/reference/react)
- [Better Auth — Discord Provider](https://www.better-auth.com/docs/authentication/discord)

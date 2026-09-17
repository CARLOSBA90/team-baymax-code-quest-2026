/**
 * Auth Context Mock — Para testing de componentes React
 *
 * Uso: Importa este mock en tus tests o storybook para simular
 * el estado de autenticación sin necesitar un backend real.
 *
 * Ejemplo:
 *   import { MockAuthProvider, mockSession } from '@/mocks/auth-context.mock';
 *
 *   render(
 *     <MockAuthProvider session={mockSession.authenticated}>
 *       <MyComponent />
 *     </MockAuthProvider>
 *   );
 */

import React, { createContext, useContext, ReactNode } from 'react';

// ============================================
// Tipos
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionData {
  id: string;
  token: string;
  expiresAt: string;
  userId: string;
}

interface AuthSession {
  user: User;
  session: SessionData;
}

interface AuthContextType {
  data: AuthSession | null;
  isPending: boolean;
  error: Error | null;
}

// ============================================
// Datos Mock
// ============================================

export const mockUsers: Record<string, User> = {
  carlos: {
    id: 'clx1abc001',
    name: 'Carlos Pérez',
    email: 'carlos@example.com',
    emailVerified: true,
    image: null,
    createdAt: '2026-01-15T10:30:00.000Z',
    updatedAt: '2026-03-20T14:00:00.000Z',
  },
  maria: {
    id: 'clx1abc002',
    name: 'María García',
    email: 'maria@example.com',
    emailVerified: true,
    image: 'https://i.pravatar.cc/150?u=maria',
    createdAt: '2026-02-10T08:15:00.000Z',
    updatedAt: '2026-04-05T11:30:00.000Z',
  },
  unverified: {
    id: 'clx1abc003',
    name: 'Juan López',
    email: 'juan@example.com',
    emailVerified: false,
    image: null,
    createdAt: '2026-05-01T16:45:00.000Z',
    updatedAt: '2026-05-01T16:45:00.000Z',
  },
};

export const mockSession = {
  /** Sesión autenticada con usuario verificado */
  authenticated: {
    user: mockUsers.carlos,
    session: {
      id: 'ses_mock_001',
      token: 'mock-token-authenticated',
      expiresAt: '2026-12-31T23:59:59.000Z',
      userId: mockUsers.carlos.id,
    },
  } as AuthSession,

  /** Sin sesión (no autenticado) */
  unauthenticated: null as AuthSession | null,

  /** Sesión con usuario no verificado */
  unverified: {
    user: mockUsers.unverified,
    session: {
      id: 'ses_mock_002',
      token: 'mock-token-unverified',
      expiresAt: '2026-12-31T23:59:59.000Z',
      userId: mockUsers.unverified.id,
    },
  } as AuthSession,
};

// ============================================
// Context y Provider Mock
// ============================================

const AuthContext = createContext<AuthContextType>({
  data: null,
  isPending: false,
  error: null,
});

interface MockAuthProviderProps {
  children: ReactNode;
  /** Sesión a simular. Usar mockSession.authenticated, .unauthenticated, etc. */
  session?: AuthSession | null;
  /** Simular estado de carga */
  isPending?: boolean;
  /** Simular error */
  error?: Error | null;
}

/**
 * Provider mock para envolver componentes en tests
 */
export function MockAuthProvider({
  children,
  session = mockSession.authenticated,
  isPending = false,
  error = null,
}: MockAuthProviderProps) {
  return (
    <AuthContext.Provider value={{ data: session, isPending, error }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook mock que reemplaza useSession de better-auth
 */
export function useMockSession() {
  return useContext(AuthContext);
}

// ============================================
// Funciones mock de auth
// ============================================

/** Mock de signIn — simula un login exitoso */
export const mockSignIn = {
  email: async (_credentials: { email: string; password: string }) => {
    console.log('[MOCK] signIn.email called');
    return { data: mockSession.authenticated, error: null };
  },
};

/** Mock de signUp — simula un registro exitoso */
export const mockSignUp = {
  email: async (_data: { name: string; email: string; password: string }) => {
    console.log('[MOCK] signUp.email called');
    return { data: mockSession.authenticated, error: null };
  },
};

/** Mock de signOut — simula cerrar sesión */
export const mockSignOut = async () => {
  console.log('[MOCK] signOut called');
  return { data: null, error: null };
};

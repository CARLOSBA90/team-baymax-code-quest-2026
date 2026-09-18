/**
 * API Client Mock — Para desarrollo frontend sin backend
 *
 * Reemplaza las llamadas reales a la API con datos mock.
 * Simula latencia de red y respuestas realistas.
 *
 * Uso:
 *   import { mockApiClient } from '@/mocks/api-client.mock';
 *
 *   // En lugar de:
 *   const tasks = await apiClient.get('/tasks');
 *
 *   // Usa:
 *   const tasks = await mockApiClient.tasks.findAll();
 */

// ============================================
// Datos mock importados
// ============================================

import tasksMockData from '../backend/tasks.mock.json';
import usersMockData from '../backend/users.mock.json';
import authMockData from '../backend/auth-responses.mock.json';

// ============================================
// Helper: Simular latencia de red
// ============================================

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Mock API Client
// ============================================

export const mockApiClient = {
  /**
   * Tasks API Mock
   */
  tasks: {
    async findAll(page = 1, limit = 10) {
      await delay(400);
      const start = (page - 1) * limit;
      const tasks = tasksMockData.data.tasks.slice(start, start + limit);
      return {
        data: tasks,
        meta: {
          total: tasksMockData.data.tasks.length,
          page,
          limit,
          totalPages: Math.ceil(tasksMockData.data.tasks.length / limit),
        },
      };
    },

    async findOne(id: string) {
      await delay(200);
      const task = tasksMockData.data.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error(`Task with ID "${id}" not found`);
      }
      return { data: task };
    },

    async create(data: { title: string; description?: string; priority?: string }) {
      await delay(500);
      const newTask = {
        id: `tsk_${Date.now()}`,
        title: data.title,
        description: data.description || null,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        message: 'Tarea creada exitosamente',
        data: newTask,
      };
    },

    async update(id: string, data: Record<string, unknown>) {
      await delay(300);
      const task = tasksMockData.data.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error(`Task with ID "${id}" not found`);
      }
      return {
        message: 'Tarea actualizada exitosamente',
        data: { ...task, ...data, updatedAt: new Date().toISOString() },
      };
    },

    async remove(id: string) {
      await delay(200);
      const task = tasksMockData.data.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error(`Task with ID "${id}" not found`);
      }
      return { message: 'Tarea eliminada exitosamente' };
    },
  },

  /**
   * Users API Mock
   */
  users: {
    async getProfile() {
      await delay(200);
      return usersMockData.responses.getProfile.body;
    },

    async updateProfile(data: { name?: string }) {
      await delay(300);
      return {
        message: 'Perfil actualizado',
        data: {
          ...usersMockData.data.users[0],
          ...data,
          updatedAt: new Date().toISOString(),
        },
      };
    },
  },

  /**
   * Auth API Mock
   */
  auth: {
    async signIn(email: string, _password: string) {
      await delay(600);
      const user = usersMockData.data.users.find((u) => u.email === email);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      return authMockData.responses.signIn_success.body;
    },

    async signUp(name: string, email: string, _password: string) {
      await delay(800);
      return {
        ...authMockData.responses.signUp_success.body,
        user: {
          ...authMockData.responses.signUp_success.body.user,
          name,
          email,
        },
      };
    },

    async signOut() {
      await delay(200);
      return authMockData.responses.signOut_success.body;
    },

    async getSession() {
      await delay(150);
      return authMockData.responses.getSession_authenticated.body;
    },
  },
};

// ============================================
// Export tipos útiles
// ============================================

export type Task = (typeof tasksMockData.data.tasks)[0];
export type User = (typeof usersMockData.data.users)[0];

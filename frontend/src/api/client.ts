import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import type { ApiPaginated, ApiResponse, PageMeta } from "@/types/api";

const rawBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (!rawBaseUrl) {
  throw new Error(
    "VITE_API_URL no está definida. Configúrala en .env (solo origen, p. ej. http://localhost:3001).",
  );
}

// Punto de extensión: el interceptor 401 (cambio Better Auth) se registrará desde su propio
// módulo con `apiClient.interceptors.response.use(undefined, onError)`. Esta capa no conoce
// la autenticación: solo cookies de sesión vía `withCredentials`.
export const apiClient = axios.create({
  baseURL: `${rawBaseUrl.replace(/\/+$/, "")}/api/v1`,
  withCredentials: true,
});

export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data.data);
}

export function post<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiClient.post<ApiResponse<T>>(url, body, config).then((res) => res.data.data);
}

export function put<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiClient.put<ApiResponse<T>>(url, body, config).then((res) => res.data.data);
}

export function patch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiClient.patch<ApiResponse<T>>(url, body, config).then((res) => res.data.data);
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data.data);
}

export function getPage<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ items: T[]; meta: PageMeta }> {
  return apiClient
    .get<ApiPaginated<T>>(url, config)
    .then((res) => ({ items: res.data.data, meta: res.data.meta }));
}

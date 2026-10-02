import axios from 'axios';
import { environment } from '../../environments/environment';

/** Clave donde se guarda el token de sesión en localStorage. */
export const TOKEN_KEY = 'token';

/**
 * Cliente Axios compartido por todos los servicios.
 * Usa la URL base del backend y agrega el token a cada petición.
 */
export const http = axios.create({ baseURL: environment.apiUrl });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Devuelve el mensaje de error enviado por el backend, o uno genérico. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  return axios.isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback;
}

/** Indica si el backend rechazó la petición por token inválido o expirado. */
export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

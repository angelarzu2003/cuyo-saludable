import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import axios, { AxiosRequestConfig } from 'axios';
import { environment } from '../../environments/environment';
import { ConnectivityService } from './connectivity.service';
import { SessionService } from './session.service';
import { StorageService } from './storage.service';

const API_URL_KEY = 'apiUrl';
const CACHE_PREFIX = 'cache:';
const TIMEOUT_MS = 8000;
const SERVER_UNREACHABLE = [502, 503, 504];

/** Tipos de error que puede producir una petición. */
export type ApiErrorKind = 'network' | 'unauthorized' | 'validation' | 'not_found' | 'server';

/** Error de la API con un mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  constructor(message: string, readonly kind: ApiErrorKind) {
    super(message);
  }
}

/** true si el error se debe a que no hay conexión con el servidor. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

/**
 * Cliente HTTP de la app (Axios). Centraliza:
 * - La URL del backend y el token de sesión en cada petición.
 * - La conversión de cualquier fallo en un ApiError con mensaje claro.
 * - La caché para poder mostrar datos sin conexión.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private storage = inject(StorageService);
  private session = inject(SessionService);
  private connectivity = inject(ConnectivityService);
  private router = inject(Router);

  /** URL del backend. Se puede cambiar desde Perfil (útil al usar la app en un celular). */
  readonly baseUrl = signal(this.storage.get<string>(API_URL_KEY) ?? environment.apiUrl);

  setBaseUrl(url: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, ''); // sin "/" al final
    this.baseUrl.set(cleanUrl);
    this.storage.set(API_URL_KEY, cleanUrl);
  }

  get<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'GET', url });
  }

  post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', url, data });
  }

  put<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url });
  }

  /**
   * GET con caché: guarda cada respuesta en el dispositivo y,
   * si no hay conexión, devuelve la última copia guardada.
   */
  async getCached<T>(url: string): Promise<T> {
    try {
      const data = await this.get<T>(url);
      this.storage.set(CACHE_PREFIX + url, data);
      return data;
    } catch (error) {
      const cached = this.storage.get<T>(CACHE_PREFIX + url);
      if (isNetworkError(error) && cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.storage.removeByPrefix(CACHE_PREFIX);
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const token = this.session.token;
    try {
      const { data } = await axios.request<T>({
        ...config,
        baseURL: this.baseUrl(),
        timeout: TIMEOUT_MS,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      this.connectivity.markOnline();
      return data;
    } catch (error) {
      throw this.toApiError(error, token !== null);
    }
  }

  /** Convierte cualquier error en un ApiError con un mensaje claro para el usuario. */
  private toApiError(error: unknown, hadSession: boolean): ApiError {
    if (!axios.isAxiosError(error)) {
      return new ApiError('Ocurrió un error inesperado', 'server');
    }

    // Sin respuesta: no hay internet, el servidor está apagado o tardó demasiado.
    // 502/503/504 también indican servidor inalcanzable (el Service Worker responde 504 sin red).
    if (!error.response || SERVER_UNREACHABLE.includes(error.response.status)) {
      this.connectivity.markOffline();
      return new ApiError('Sin conexión con el servidor. Inténtalo cuando vuelvas a estar en línea.', 'network');
    }

    this.connectivity.markOnline();
    const message: string = error.response.data?.message ?? 'Error del servidor';

    switch (error.response.status) {
      case 401:
        if (hadSession) {
          this.endExpiredSession();
        }
        return new ApiError(message, 'unauthorized');
      case 400:
        return new ApiError(message, 'validation');
      case 404:
        return new ApiError(message, 'not_found');
      default:
        return new ApiError(message, 'server');
    }
  }

  /** El token ya no es válido: se cierra la sesión local y se vuelve al login. */
  private endExpiredSession(): void {
    this.session.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

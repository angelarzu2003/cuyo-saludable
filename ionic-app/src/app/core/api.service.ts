import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { HealthResponse } from '../interfaces';
import { ENDPOINTS } from './api-endpoints';
import { isNetworkError } from './api-error';
import { StorageService } from './storage.service';

const API_URL_KEY = 'apiUrl';
const CACHE_PREFIX = 'cache:';

/**
 * Cliente de la API REST (Angular HttpClient). Centraliza:
 * - La URL del servidor (editable desde Perfil, útil al usar la app en un celular).
 * - Las peticiones GET / POST / PUT / DELETE, devueltas como Promise.
 * - La caché para poder mostrar datos sin conexión.
 *
 * El token y la conversión de errores los agregan los interceptores
 * (auth.interceptor.ts y api-error.interceptor.ts) a TODAS las peticiones.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  /** URL del backend, ej. http://192.168.1.50/proyecto/api */
  readonly baseUrl = signal(this.storage.get<string>(API_URL_KEY) ?? environment.apiUrl);

  setBaseUrl(url: string): void {
    const cleanUrl = normalizeUrl(url);
    this.baseUrl.set(cleanUrl);
    this.storage.set(API_URL_KEY, cleanUrl);
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * GET con caché: guarda cada respuesta en el dispositivo y,
   * si no hay conexión, devuelve la última copia guardada.
   */
  async getCached<T>(path: string): Promise<T> {
    try {
      const data = await this.get<T>(path);
      this.storage.set(CACHE_PREFIX + path, data);
      return data;
    } catch (error) {
      const cached = this.storage.get<T>(CACHE_PREFIX + path);
      if (isNetworkError(error) && cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.storage.removeByPrefix(CACHE_PREFIX);
  }

  /** Comprueba si la API responde en esa URL (GET /health), sin guardarla. */
  checkHealth(url = this.baseUrl()): Promise<HealthResponse> {
    return firstValueFrom(this.http.get<HealthResponse>(normalizeUrl(url) + ENDPOINTS.health));
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.request<T>(method, this.baseUrl() + path, { body }));
  }
}

/** Quita espacios y la "/" final: "http://pc/api/ " -> "http://pc/api" */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

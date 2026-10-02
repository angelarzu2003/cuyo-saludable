import { Injectable } from '@angular/core';

/**
 * Persistencia local del dispositivo: guarda y lee datos como JSON en localStorage.
 * Si algún día se cambia a otro almacenamiento, solo se modifica este archivo.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // dato corrupto: se ignora
    }
  }

  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** Borra todas las claves que empiezan con el prefijo dado (ej. la caché). */
  removeByPrefix(prefix: string): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}

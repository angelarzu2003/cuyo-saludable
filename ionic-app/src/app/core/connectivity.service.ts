import { Injectable, signal } from '@angular/core';

/**
 * Estado de la conexión con el servidor.
 * Se actualiza con los eventos del navegador (online/offline) y con el resultado
 * de cada petición: si el servidor no responde, también lo consideramos "sin conexión".
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  markOnline(): void {
    this.isOnline.set(true);
  }

  markOffline(): void {
    this.isOnline.set(false);
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { LoadingController } from '@ionic/angular/lazy';

/**
 * Indicadores de carga durante las solicitudes a la API.
 * - Barra de progreso global: se muestra mientras haya alguna petición HTTP en curso
 *   (el contador lo actualiza loadingInterceptor en TODAS las peticiones).
 * - run(): aviso que bloquea la pantalla durante una acción importante (ej. "Eliminando...").
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingController = inject(LoadingController);
  private pendingRequests = signal(0);

  /** true mientras haya al menos una petición en curso. */
  readonly isBusy = computed(() => this.pendingRequests() > 0);

  start(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  stop(): void {
    this.pendingRequests.update((count) => Math.max(count - 1, 0));
  }

  /** Muestra un aviso de carga con el mensaje dado mientras se ejecuta la tarea. */
  async run<T>(message: string, task: () => Promise<T>): Promise<T> {
    const overlay = await this.loadingController.create({ message, spinner: 'crescent' });
    await overlay.present();
    try {
      return await task();
    } finally {
      await overlay.dismiss();
    }
  }
}

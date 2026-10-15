import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/lazy';
import { ApiError } from './api-error';

/** Mensajes cortos (toasts) para informar al usuario. */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private toastController = inject(ToastController);

  success(message: string): Promise<void> {
    return this.show(message, 'success');
  }

  info(message: string): Promise<void> {
    return this.show(message, 'medium');
  }

  /** Muestra el mensaje de un ApiError; para errores técnicos usa un texto genérico. */
  error(error: unknown, fallback = 'Ocurrió un error inesperado'): Promise<void> {
    const message = error instanceof ApiError ? error.message : fallback;
    return this.show(message, 'danger');
  }

  private async show(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }
}

import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotifyService } from './notify.service';

/**
 * Red de seguridad: atrapa cualquier error que ninguna página haya manejado,
 * lo registra en consola y avisa al usuario en vez de dejar la app "congelada".
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notify = inject(NotifyService);

  handleError(error: unknown): void {
    console.error(error);
    this.notify.error(error);
  }
}

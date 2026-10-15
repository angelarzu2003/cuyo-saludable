import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TimeoutError, catchError, tap, throwError, timeout } from 'rxjs';
import { ApiErrorResponse } from '../interfaces';
import { ApiError } from './api-error';
import { ConnectivityService } from './connectivity.service';
import { SessionService } from './session.service';

const TIMEOUT_MS = 8000;
// 0 = no hubo respuesta. 502/503/504 = servidor inalcanzable (el Service Worker responde 504 sin red).
const SERVER_UNREACHABLE = [0, 502, 503, 504];

/**
 * Convierte cualquier fallo HTTP en un ApiError con un mensaje claro para el usuario,
 * actualiza el estado de conexión y, si el token expiró (401), cierra la sesión.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const connectivity = inject(ConnectivityService);
  const session = inject(SessionService);
  const router = inject(Router);
  const hadSession = req.headers.has('Authorization');

  return next(req).pipe(
    timeout(TIMEOUT_MS),
    tap((event) => {
      if (event instanceof HttpResponse) {
        connectivity.markOnline();
      }
    }),
    catchError((error: unknown) => throwError(() => toApiError(error))),
  );

  function toApiError(error: unknown): ApiError {
    // Sin respuesta: no hay internet, el servidor está apagado o tardó demasiado
    if (error instanceof TimeoutError || (error instanceof HttpErrorResponse && SERVER_UNREACHABLE.includes(error.status))) {
      connectivity.markOffline();
      return new ApiError('Sin conexión con el servidor. Inténtalo cuando vuelvas a estar en línea.', 'network');
    }
    if (!(error instanceof HttpErrorResponse)) {
      return new ApiError('Ocurrió un error inesperado', 'server');
    }

    connectivity.markOnline();
    const message = (error.error as ApiErrorResponse | null)?.message ?? 'Error del servidor';

    switch (error.status) {
      case 401:
        if (hadSession) {
          // El token ya no es válido: se cierra la sesión local y se vuelve al login
          session.clear();
          router.navigateByUrl('/login', { replaceUrl: true });
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
};

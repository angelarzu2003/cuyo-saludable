import { ApiErrorKind } from '../interfaces';

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

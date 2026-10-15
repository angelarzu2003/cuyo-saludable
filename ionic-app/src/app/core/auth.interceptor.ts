import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

/** Agrega "Authorization: Bearer <token>" a cada petición cuando hay sesión iniciada. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionService).token;
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

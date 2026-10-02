import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Protege las páginas internas: sin sesión, redirige al login. */
export const authGuard: CanActivateFn = () => {
  return inject(SessionService).token ? true : inject(Router).parseUrl('/login');
};

/** Protege el login: si ya hay sesión, entra directo a la app. */
export const guestGuard: CanActivateFn = () => {
  return inject(SessionService).token ? inject(Router).parseUrl('/tabs/cuyos') : true;
};

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

/**
 * Mapa de navegación de la app:
 *
 * /login
 * /tabs                          (pestañas, requiere sesión)
 *   ├─ /cuyos                    Mis cuyos (lista)
 *   │    ├─ /nuevo               Crear cuyo
 *   │    ├─ /:id                 Detalle del cuyo
 *   │    └─ /:id/editar          Editar cuyo
 *   ├─ /evaluar                  Formulario "carrito" (?cuyo=ID para preseleccionar)
 *   ├─ /historial                Evaluaciones guardadas y pendientes
 *   │    └─ /:id                 Detalle de una evaluación
 *   └─ /perfil                   Usuario, sincronización y servidor
 */
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'cuyos',
        children: [
          { path: '', loadComponent: () => import('./pages/cuyos/cuyos.page').then((m) => m.CuyosPage) },
          { path: 'nuevo', loadComponent: () => import('./pages/cuyo-form/cuyo-form.page').then((m) => m.CuyoFormPage) },
          { path: ':id', loadComponent: () => import('./pages/cuyo-detail/cuyo-detail.page').then((m) => m.CuyoDetailPage) },
          { path: ':id/editar', loadComponent: () => import('./pages/cuyo-form/cuyo-form.page').then((m) => m.CuyoFormPage) },
        ],
      },
      {
        path: 'evaluar',
        loadComponent: () => import('./pages/evaluate/evaluate.page').then((m) => m.EvaluatePage),
      },
      {
        path: 'historial',
        children: [
          { path: '', loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPage) },
          {
            path: ':id',
            loadComponent: () => import('./pages/evaluation-detail/evaluation-detail.page').then((m) => m.EvaluationDetailPage),
          },
        ],
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      { path: '', redirectTo: 'cuyos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular/lazy';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { apiErrorInterceptor } from './core/api-error.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { GlobalErrorHandler } from './core/global-error-handler';
import { loadingInterceptor } from './core/loading.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Cliente HTTP para consumir la API:
    // 1) barra de carga global, 2) agrega el token, 3) convierte los errores en ApiError
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, apiErrorInterceptor])),
    // Errores no controlados -> GlobalErrorHandler (también promesas rechazadas)
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Service Worker: guarda los archivos de la app para que abra sin conexión (versión web/XAMPP)
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.serviceWorker,
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

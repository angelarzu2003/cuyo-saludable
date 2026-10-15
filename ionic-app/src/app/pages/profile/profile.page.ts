import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular/lazy';
import { ApiService } from '../../core/api.service';
import { ConnectivityService } from '../../core/connectivity.service';
import { NotifyService } from '../../core/notify.service';
import { SessionService } from '../../core/session.service';
import { SyncService } from '../../core/sync.service';
import { AuthService } from '../../services/auth.service';

/** Datos del usuario, estado de conexión/sincronización, servidor y cierre de sesión. */
@Component({
  selector: 'app-profile',
  imports: [IonicModule, FormsModule],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  readonly user = inject(SessionService).user;
  readonly connectivity = inject(ConnectivityService);
  readonly sync = inject(SyncService);
  readonly appVersion = '1.2.0';

  serverUrl = this.api.baseUrl();
  isTesting = signal(false);

  async saveServerUrl() {
    this.api.setBaseUrl(this.serverUrl);
    this.serverUrl = this.api.baseUrl();
    await this.notify.success('Servidor guardado');
  }

  /** Prueba la URL escrita (GET /health) antes de guardarla. */
  async testServerUrl() {
    this.isTesting.set(true);
    try {
      const health = await this.api.checkHealth(this.serverUrl);
      await this.notify.success(`✅ ${health.service} v${health.version} · base de datos ${health.database}`);
    } catch {
      await this.notify.error(null, 'La API no responde en esa URL. Revisa la IP y que XAMPP esté encendido.');
    } finally {
      this.isTesting.set(false);
    }
  }

  async confirmLogout() {
    const pending = this.sync.pending().length;
    const alert = await this.alertController.create({
      header: '¿Cerrar sesión?',
      message: pending > 0 ? `Tienes ${pending} evaluación(es) sin sincronizar que se perderán.` : undefined,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sesión', role: 'destructive', handler: () => this.logout() },
      ],
    });
    await alert.present();
  }

  private async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

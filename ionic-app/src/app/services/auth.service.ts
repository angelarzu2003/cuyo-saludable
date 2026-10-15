import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../core/api-endpoints';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { SyncService } from '../core/sync.service';
import { LoginRequest, LoginResponse } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private session = inject(SessionService);
  private sync = inject(SyncService);

  /** Inicia sesión y guarda el token y el usuario en el dispositivo. */
  async login(email: string, password: string): Promise<void> {
    const body: LoginRequest = { email, password };
    const data = await this.api.post<LoginResponse>(ENDPOINTS.login, body);
    this.session.start(data.token, data.user);
  }

  /** Cierra sesión en el servidor (si hay conexión) y borra los datos locales. */
  async logout(): Promise<void> {
    try {
      await this.api.post(ENDPOINTS.logout);
    } catch {
      // Sin conexión no importa: el token expira solo en el servidor
    }
    this.session.clear();
    this.api.clearCache();
    this.sync.clear();
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular/lazy';
import { NotifyService } from '../../core/notify.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [IonicModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private authService = inject(AuthService);
  private notify = inject(NotifyService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);

  async onLogin() {
    if (!this.email || !this.password) {
      await this.notify.info('Ingresa email y contraseña');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authService.login(this.email, this.password);
      this.password = '';
      this.router.navigateByUrl('/tabs/cuyos', { replaceUrl: true });
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  async onLogin() {
    if (!this.email || !this.password) {
      await this.showAlert('Faltan datos', 'Ingresa email y contraseña.');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Ingresando...' });
    await loading.present();

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      await this.showAlert('Error', (error as Error).message);
    } finally {
      await loading.dismiss();
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}

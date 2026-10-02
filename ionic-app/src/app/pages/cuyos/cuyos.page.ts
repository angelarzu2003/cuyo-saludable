import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular/lazy';
import { NotifyService } from '../../core/notify.service';
import { Cuyo } from '../../models/cuyo.model';
import { HEALTH_LEVELS } from '../../models/diet.model';
import { CuyoService } from '../../services/cuyo.service';
import { AgePipe } from '../../shared/age.pipe';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';

/** Lista de cuyos del usuario (READ del CRUD). */
@Component({
  selector: 'app-cuyos',
  imports: [IonicModule, RouterLink, AgePipe, OfflineBannerComponent],
  templateUrl: './cuyos.page.html',
})
export class CuyosPage {
  private cuyoService = inject(CuyoService);
  private notify = inject(NotifyService);

  readonly levels = HEALTH_LEVELS;
  cuyos = signal<Cuyo[]>([]);
  isLoading = signal(true);

  /** Ionic llama a este método cada vez que se entra a la página (ej. al volver de editar). */
  ionViewWillEnter() {
    this.load();
  }

  async load(refresher?: RefresherCustomEvent) {
    try {
      this.cuyos.set(await this.cuyoService.list());
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isLoading.set(false);
      refresher?.target.complete();
    }
  }
}

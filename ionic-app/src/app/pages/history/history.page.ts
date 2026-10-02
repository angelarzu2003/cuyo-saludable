import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent } from '@ionic/angular/lazy';
import { NotifyService } from '../../core/notify.service';
import { SyncService } from '../../core/sync.service';
import { EvaluationSummary, HEALTH_LEVELS } from '../../models/diet.model';
import { DietService } from '../../services/diet.service';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';

/** Todas las evaluaciones: las pendientes (offline) y las guardadas en el servidor. */
@Component({
  selector: 'app-history',
  imports: [IonicModule, RouterLink, DatePipe, OfflineBannerComponent],
  templateUrl: './history.page.html',
})
export class HistoryPage {
  private dietService = inject(DietService);
  private notify = inject(NotifyService);
  private alertController = inject(AlertController);
  readonly sync = inject(SyncService);

  readonly levels = HEALTH_LEVELS;
  evaluations = signal<EvaluationSummary[]>([]);
  isLoading = signal(true);

  constructor() {
    // Cuando se sincronizan pendientes, recargamos la lista
    this.sync.synced$.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ionViewWillEnter() {
    this.load();
  }

  async load() {
    try {
      this.evaluations.set(await this.dietService.getHistory());
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Deslizar hacia abajo: intenta sincronizar pendientes y recarga. */
  async refresh(refresher: RefresherCustomEvent) {
    await this.sync.sync();
    await this.load();
    refresher.target.complete();
  }

  async confirmDelete(evaluation: EvaluationSummary) {
    const alert = await this.alertController.create({
      header: '¿Eliminar evaluación?',
      message: `Dieta de ${evaluation.cuyo_name} (${evaluation.score} pts).`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.delete(evaluation.id) },
      ],
    });
    await alert.present();
  }

  private async delete(id: number) {
    try {
      await this.dietService.deleteEvaluation(id);
      this.evaluations.update((list) => list.filter((item) => item.id !== id));
      await this.notify.success('Evaluación eliminada');
    } catch (error) {
      await this.notify.error(error);
    }
  }
}

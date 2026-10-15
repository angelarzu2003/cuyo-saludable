import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular/lazy';
import { ApiError } from '../../core/api-error';
import { LoadingService } from '../../core/loading.service';
import { NotifyService } from '../../core/notify.service';
import { CuyoService } from '../../services/cuyo.service';
import { DietService } from '../../services/diet.service';
import { AgePipe } from '../../shared/age.pipe';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';
import { Cuyo, EvaluationSummary } from '../../interfaces';
import { HEALTH_LEVELS } from '../../shared/health-levels';

/** Datos de un cuyo, su historial de dietas y acciones (evaluar, editar, eliminar). */
@Component({
  selector: 'app-cuyo-detail',
  imports: [IonicModule, RouterLink, DatePipe, AgePipe, OfflineBannerComponent],
  templateUrl: './cuyo-detail.page.html',
})
export class CuyoDetailPage {
  private cuyoService = inject(CuyoService);
  private dietService = inject(DietService);
  private notify = inject(NotifyService);
  private loading = inject(LoadingService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly levels = HEALTH_LEVELS;

  cuyo = signal<Cuyo | null>(null);
  evaluations = signal<EvaluationSummary[]>([]);

  ionViewWillEnter() {
    this.load();
  }

  async load() {
    try {
      const [cuyo, evaluations] = await Promise.all([
        this.cuyoService.get(this.id),
        this.dietService.getHistory(this.id),
      ]);
      this.cuyo.set(cuyo);
      this.evaluations.set(evaluations);
    } catch (error) {
      await this.notify.error(error);
      if (error instanceof ApiError && error.kind === 'not_found') {
        this.router.navigateByUrl('/tabs/cuyos', { replaceUrl: true });
      }
    }
  }

  evaluateDiet() {
    this.router.navigate(['/tabs/evaluar'], { queryParams: { cuyo: this.id } });
  }

  /** Pide confirmación antes de eliminar (la acción no se puede deshacer). */
  async confirmDelete() {
    const alert = await this.alertController.create({
      header: `¿Eliminar a ${this.cuyo()?.name}?`,
      message: 'También se eliminarán todas sus evaluaciones.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        // Sin esperar la promesa: la alerta se cierra y se ve el aviso "Eliminando..."
        { text: 'Eliminar', role: 'destructive', handler: () => void this.delete() },
      ],
    });
    await alert.present();
  }

  private async delete() {
    try {
      await this.loading.run('Eliminando cuyo...', () => this.cuyoService.remove(this.id));
      await this.notify.success('Cuyo eliminado');
      this.router.navigateByUrl('/tabs/cuyos', { replaceUrl: true });
    } catch (error) {
      await this.notify.error(error);
    }
  }
}

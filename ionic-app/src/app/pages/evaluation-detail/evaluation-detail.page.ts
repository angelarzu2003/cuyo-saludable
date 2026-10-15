import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular/lazy';
import { LoadingService } from '../../core/loading.service';
import { NotifyService } from '../../core/notify.service';
import { DietService } from '../../services/diet.service';
import { DietResultComponent } from '../../shared/diet-result.component';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';
import { EvaluationDetail } from '../../interfaces';

/** Detalle de una evaluación guardada: puntaje, recomendaciones y lo que comió. */
@Component({
  selector: 'app-evaluation-detail',
  imports: [IonicModule, DatePipe, DietResultComponent, OfflineBannerComponent],
  templateUrl: './evaluation-detail.page.html',
})
export class EvaluationDetailPage implements OnInit {
  private dietService = inject(DietService);
  private notify = inject(NotifyService);
  private loading = inject(LoadingService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  evaluation = signal<EvaluationDetail | null>(null);

  async ngOnInit() {
    try {
      this.evaluation.set(await this.dietService.getEvaluation(this.id));
    } catch (error) {
      await this.notify.error(error);
      this.router.navigateByUrl('/tabs/historial', { replaceUrl: true });
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      header: '¿Eliminar evaluación?',
      message: 'Esta acción no se puede deshacer.',
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
      await this.loading.run('Eliminando evaluación...', () => this.dietService.deleteEvaluation(this.id));
      await this.notify.success('Evaluación eliminada');
      this.router.navigateByUrl('/tabs/historial', { replaceUrl: true });
    } catch (error) {
      await this.notify.error(error);
    }
  }
}

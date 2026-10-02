import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular/lazy';
import { NotifyService } from '../../core/notify.service';
import { CuyoService } from '../../services/cuyo.service';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';
import { CuyoSex } from '../../interfaces';

/** Formulario para CREAR un cuyo (/cuyos/nuevo) o EDITARLO (/cuyos/:id/editar). */
@Component({
  selector: 'app-cuyo-form',
  imports: [IonicModule, ReactiveFormsModule, OfflineBannerComponent],
  templateUrl: './cuyo-form.page.html',
})
export class CuyoFormPage implements OnInit {
  private cuyoService = inject(CuyoService);
  private notify = inject(NotifyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** id del cuyo a editar; null cuando se está creando uno nuevo. */
  readonly cuyoId = Number(this.route.snapshot.paramMap.get('id')) || null;
  isSaving = signal(false);

  // Mismas reglas que valida el backend (api/cuyos.php)
  readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    sex: ['hembra' as CuyoSex, Validators.required],
    age_months: [6, [Validators.required, Validators.min(0), Validators.max(120)]],
    weight_g: [800, [Validators.required, Validators.min(50), Validators.max(3000)]],
  });

  async ngOnInit() {
    if (!this.cuyoId) {
      return;
    }
    // Modo edición: cargamos los datos actuales en el formulario
    try {
      this.form.patchValue(await this.cuyoService.get(this.cuyoId));
    } catch (error) {
      await this.notify.error(error);
      this.router.navigateByUrl('/tabs/cuyos', { replaceUrl: true });
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // muestra los mensajes de error
      return;
    }

    this.isSaving.set(true);
    try {
      const data = this.form.getRawValue();
      const cuyo = this.cuyoId
        ? await this.cuyoService.update(this.cuyoId, data)
        : await this.cuyoService.create(data);

      await this.notify.success(this.cuyoId ? 'Cuyo actualizado' : `¡${cuyo.name} fue registrado!`);
      this.router.navigateByUrl(`/tabs/cuyos/${cuyo.id}`, { replaceUrl: true });
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }
}

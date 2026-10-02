import { Component, input } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { EvaluationDetail, FeedbackType, HEALTH_LEVELS } from '../models/diet.model';

/** Ícono y color de cada tipo de recomendación. */
const FEEDBACK_ICONS: Record<FeedbackType, { icon: string; color: string }> = {
  ok: { icon: 'checkmark-circle', color: 'success' },
  warning: { icon: 'alert-circle', color: 'warning' },
  danger: { icon: 'close-circle', color: 'danger' },
};

/** Muestra el puntaje de una evaluación y sus recomendaciones. */
@Component({
  selector: 'app-diet-result',
  imports: [IonicModule],
  template: `
    <div class="summary">
      <div class="score" [class]="evaluation().level">
        <span>{{ evaluation().score }}<small>/100</small></span>
      </div>
      <h2>{{ levels[evaluation().level].emoji }} {{ levels[evaluation().level].title }}</h2>
      <p>Dieta de <strong>{{ evaluation().cuyo_name }}</strong></p>
    </div>

    <ion-list lines="none">
      @for (item of evaluation().feedback; track $index) {
        <ion-item>
          <ion-icon slot="start" [name]="icons[item.type].icon" [color]="icons[item.type].color"></ion-icon>
          <ion-label class="ion-text-wrap">{{ item.text }}</ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: `
    .summary {
      text-align: center;
    }

    .score {
      width: 130px;
      height: 130px;
      margin: 8px auto 16px;
      display: grid;
      place-content: center;
      font-size: 2.6rem;
      font-weight: 800;
      border: 10px solid currentColor;
      border-radius: 50%;

      small {
        font-size: 0.9rem;
      }

      &.excelente { color: var(--ion-color-success); }
      &.buena     { color: var(--ion-color-primary); }
      &.regular   { color: var(--ion-color-warning); }
      &.peligro   { color: var(--ion-color-danger); }
    }

    ion-list {
      background: transparent;
    }
  `,
})
export class DietResultComponent {
  readonly evaluation = input.required<EvaluationDetail>();

  readonly levels = HEALTH_LEVELS;
  readonly icons = FEEDBACK_ICONS;
}

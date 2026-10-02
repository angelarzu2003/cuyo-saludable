import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular/lazy';
import { NotifyService } from '../../core/notify.service';
import { CuyoService } from '../../services/cuyo.service';
import { DietService } from '../../services/diet.service';
import { DietResultComponent } from '../../shared/diet-result.component';
import { OfflineBannerComponent } from '../../shared/offline-banner.component';
import { CartItem, Cuyo, EvaluationDetail, Food, FoodSection } from '../../interfaces';

/** Máximo de porciones por alimento (igual que en el backend). */
const MAX_PORTIONS = 10;

/** Secciones del formulario: agrupan categorías y explican cuánto dar de cada una. */
const SECTIONS: Omit<FoodSection, 'foods'>[] = [
  { title: 'Lo básico', hint: 'Heno y agua ilimitados, todos los días.', categories: ['heno', 'agua'] },
  { title: 'Verduras', hint: 'De 3 a 6 porciones al día. Son su fuente de vitamina C.', categories: ['verdura'] },
  { title: 'Pellets', hint: 'Una cucharada al día como complemento.', categories: ['pellet'] },
  { title: 'Frutas', hint: 'Solo como premio: máximo 2 porciones.', categories: ['fruta'] },
  { title: 'Prohibidos', hint: 'Son tóxicos: nunca se los des a tu cuyo.', categories: ['prohibido'], isDanger: true },
];

@Component({
  selector: 'app-evaluate',
  imports: [IonicModule, FormsModule, RouterLink, DietResultComponent, OfflineBannerComponent],
  templateUrl: './evaluate.page.html',
  styleUrls: ['./evaluate.page.scss'],
})
export class EvaluatePage implements OnInit {
  private cuyoService = inject(CuyoService);
  private dietService = inject(DietService);
  private notify = inject(NotifyService);

  // --- Estado de la pantalla ---
  sections = signal<FoodSection[]>([]);
  cuyos = signal<Cuyo[]>([]);
  cuyoId = signal<number | null>(null);
  cart = signal<Record<number, number>>({}); // food_id -> porciones elegidas
  result = signal<EvaluationDetail | null>(null);
  isResultOpen = signal(false);
  isLoading = signal(true);
  isEvaluating = signal(false);

  /** Total de porciones en el carrito (se recalcula solo cuando cambia el carrito). */
  totalPortions = computed(() => Object.values(this.cart()).reduce((sum, quantity) => sum + quantity, 0));

  constructor() {
    // Si llegamos desde el detalle de un cuyo (?cuyo=ID), lo dejamos seleccionado
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const cuyoId = Number(params.get('cuyo'));
        if (cuyoId) {
          this.cuyoId.set(cuyoId);
        }
      });
  }

  async ngOnInit() {
    try {
      const foods = await this.dietService.getFoods();
      this.sections.set(
        SECTIONS.map((section) => ({
          ...section,
          foods: foods.filter((food) => section.categories.includes(food.category)),
        }))
      );
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Recarga la lista de cuyos al entrar (por si se registró uno nuevo). */
  async ionViewWillEnter() {
    try {
      this.cuyos.set(await this.cuyoService.list());
    } catch (error) {
      await this.notify.error(error);
    }
  }

  // --- Carrito ---

  quantityOf(food: Food): number {
    return this.cart()[food.id] ?? 0;
  }

  /** Suma (+1) o resta (-1) una porción, sin bajar de 0 ni pasar del máximo. */
  changeQuantity(food: Food, delta: number) {
    const quantity = Math.min(Math.max(this.quantityOf(food) + delta, 0), MAX_PORTIONS);
    this.cart.update((cart) => ({ ...cart, [food.id]: quantity }));
  }

  clearCart() {
    this.cart.set({});
  }

  // --- Evaluación ---

  async evaluate() {
    const cuyo = this.cuyos().find((c) => c.id === this.cuyoId());
    if (!cuyo) {
      await this.notify.info('Elige para qué cuyo es esta dieta 🐹');
      return;
    }

    // Convertimos el carrito { id: porciones } en la lista que espera el backend
    const items: CartItem[] = Object.entries(this.cart())
      .filter(([, quantity]) => quantity > 0)
      .map(([foodId, quantity]) => ({ food_id: Number(foodId), quantity }));

    this.isEvaluating.set(true);
    try {
      const result = await this.dietService.evaluate({ cuyo_id: cuyo.id, items }, cuyo.name);

      if (result) {
        this.result.set(result);
        this.isResultOpen.set(true);
      } else {
        // Sin conexión: quedó en la cola offline
        await this.notify.info(`📴 Sin conexión: la dieta de ${cuyo.name} se evaluará al reconectar`);
        this.clearCart();
      }
    } catch (error) {
      await this.notify.error(error);
    } finally {
      this.isEvaluating.set(false);
    }
  }

  /** Cierra el resultado para que el usuario ajuste la dieta actual. */
  closeResult() {
    this.isResultOpen.set(false);
  }

  /** Cierra el resultado y limpia el carrito para evaluar otra dieta. */
  startOver() {
    this.closeResult();
    this.clearCart();
  }
}

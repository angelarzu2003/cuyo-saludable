import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  CartItem,
  DietResult,
  EvaluationSummary,
  FeedbackType,
  Food,
  FoodCategory,
  HealthLevel,
} from '../models/diet.model';
import { AuthService } from '../services/auth.service';
import { DietService } from '../services/diet.service';
import { getErrorMessage, isUnauthorized } from '../services/http';

/** Máximo de porciones por alimento (igual que en el backend). */
const MAX_PORTIONS = 10;

interface Section {
  title: string;
  hint: string;
  categories: FoodCategory[];
  isDanger?: boolean;
  foods: Food[];
}

/** Secciones del formulario: agrupan categorías y explican cuánto dar de cada una. */
const SECTIONS: Omit<Section, 'foods'>[] = [
  { title: 'Lo básico', hint: 'Heno y agua ilimitados, todos los días.', categories: ['heno', 'agua'] },
  { title: 'Verduras', hint: 'De 3 a 6 porciones al día. Son su fuente de vitamina C.', categories: ['verdura'] },
  { title: 'Pellets', hint: 'Una cucharada al día como complemento.', categories: ['pellet'] },
  { title: 'Frutas', hint: 'Solo como premio: máximo 2 porciones.', categories: ['fruta'] },
  { title: 'Prohibidos', hint: 'Son tóxicos: nunca se los des a tu cuyo.', categories: ['prohibido'], isDanger: true },
];

/** Texto y color que se muestran para cada nivel de salud. */
const LEVELS: Record<HealthLevel, { title: string; emoji: string; color: string }> = {
  excelente: { title: '¡Excelente! Tu cuyo está sano y feliz', emoji: '🥳', color: 'success' },
  buena: { title: 'Buena dieta, pero puede mejorar', emoji: '🙂', color: 'primary' },
  regular: { title: 'Dieta deficiente, podría enfermar', emoji: '😟', color: 'warning' },
  peligro: { title: '¡Peligro! Esta dieta daña su salud', emoji: '🚨', color: 'danger' },
};

/** Ícono y color de cada tipo de recomendación. */
const FEEDBACK_ICONS: Record<FeedbackType, { icon: string; color: string }> = {
  ok: { icon: 'checkmark-circle', color: 'success' },
  warning: { icon: 'alert-circle', color: 'warning' },
  danger: { icon: 'close-circle', color: 'danger' },
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  readonly levels = LEVELS;
  readonly feedbackIcons = FEEDBACK_ICONS;
  readonly user = this.authService.getUser();

  // --- Estado de la pantalla ---
  sections = signal<Section[]>([]);
  cuyName = signal('');
  cart = signal<Record<number, number>>({}); // food_id -> porciones elegidas
  history = signal<EvaluationSummary[]>([]);
  result = signal<DietResult | null>(null);
  isResultOpen = signal(false);
  isLoading = signal(true);
  isEvaluating = signal(false);

  /** Total de porciones en el carrito (se recalcula solo cuando cambia el carrito). */
  totalPortions = computed(() => Object.values(this.cart()).reduce((sum, quantity) => sum + quantity, 0));

  constructor(
    private authService: AuthService,
    private dietService: DietService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    try {
      const [foods, history] = await Promise.all([this.dietService.getFoods(), this.dietService.getHistory()]);

      // Repartimos los alimentos en sus secciones
      this.sections.set(
        SECTIONS.map((section) => ({
          ...section,
          foods: foods.filter((food) => section.categories.includes(food.category)),
        }))
      );
      this.history.set(history);
    } catch (error) {
      await this.handleError(error);
    } finally {
      this.isLoading.set(false);
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
    const cuyName = this.cuyName().trim();
    if (!cuyName) {
      await this.showToast('Escribe el nombre de tu cuyo 🐹', 'warning');
      return;
    }

    // Convertimos el carrito { id: porciones } en la lista que espera el backend
    const items: CartItem[] = Object.entries(this.cart())
      .filter(([, quantity]) => quantity > 0)
      .map(([foodId, quantity]) => ({ food_id: Number(foodId), quantity }));

    this.isEvaluating.set(true);
    try {
      this.result.set(await this.dietService.evaluate(cuyName, items));
      this.isResultOpen.set(true);
      this.history.set(await this.dietService.getHistory());
    } catch (error) {
      await this.handleError(error);
    } finally {
      this.isEvaluating.set(false);
    }
  }

  /** Cierra el resultado para que el usuario ajuste la dieta actual. */
  closeResult() {
    this.isResultOpen.set(false);
  }

  /** Cierra el resultado y limpia el formulario para evaluar otra dieta. */
  startOver() {
    this.closeResult();
    this.clearCart();
    this.cuyName.set('');
  }

  // --- Sesión y mensajes ---

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /** Muestra el error y, si la sesión expiró, regresa al login. */
  private async handleError(error: unknown) {
    await this.showToast(getErrorMessage(error), 'danger');
    if (isUnauthorized(error)) {
      this.logout();
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }
}

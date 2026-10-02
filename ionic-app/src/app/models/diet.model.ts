// Tipos de datos que intercambian el frontend y la API.
// Los nombres de las propiedades son los mismos que envía el backend.

/** Categorías de alimentos (columna foods.category de la BD). */
export type FoodCategory = 'heno' | 'agua' | 'verdura' | 'pellet' | 'fruta' | 'prohibido';

export interface Food {
  id: number;
  name: string;
  emoji: string;
  category: FoodCategory;
  portion_size: string;
  vitamin_c_mg: number;
}

/** Un alimento del "carrito" tal como se envía al backend. */
export interface CartItem {
  food_id: number;
  quantity: number;
}

export type HealthLevel = 'excelente' | 'buena' | 'regular' | 'peligro';

export type FeedbackType = 'ok' | 'warning' | 'danger';

export interface Feedback {
  type: FeedbackType;
  text: string;
}

/** Resultado que devuelve el backend al evaluar una dieta. */
export interface DietResult {
  id: number;
  cuy_name: string;
  score: number;
  level: HealthLevel;
  feedback: Feedback[];
}

/** Fila del historial de evaluaciones guardadas. */
export interface EvaluationSummary {
  id: number;
  cuy_name: string;
  score: number;
  level: HealthLevel;
  created_at: string;
}

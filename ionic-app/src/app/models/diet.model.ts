// Tipos de datos de alimentos y evaluaciones.
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

/** Cuerpo del POST para evaluar una dieta. */
export interface EvaluationRequest {
  cuyo_id: number;
  items: CartItem[];
}

export type HealthLevel = 'excelente' | 'buena' | 'regular' | 'peligro';

export type FeedbackType = 'ok' | 'warning' | 'danger';

export interface Feedback {
  type: FeedbackType;
  text: string;
}

/** Fila del historial de evaluaciones. */
export interface EvaluationSummary {
  id: number;
  cuyo_id: number;
  cuyo_name: string;
  score: number;
  level: HealthLevel;
  created_at: string;
}

/** Evaluación completa: resumen + recomendaciones + alimentos que comió. */
export interface EvaluationDetail extends EvaluationSummary {
  feedback: Feedback[];
  items: { name: string; emoji: string; quantity: number }[];
}

/** Evaluación hecha sin conexión, guardada en el dispositivo hasta sincronizarse. */
export interface PendingEvaluation extends EvaluationRequest {
  local_id: number;
  cuyo_name: string;
  created_at: string;
}

/** Texto y color que se muestran para cada nivel de salud. */
export const HEALTH_LEVELS: Record<HealthLevel, { title: string; emoji: string; color: string }> = {
  excelente: { title: '¡Excelente! Tu cuyo está sano y feliz', emoji: '🥳', color: 'success' },
  buena: { title: 'Buena dieta, pero puede mejorar', emoji: '🙂', color: 'primary' },
  regular: { title: 'Dieta deficiente, podría enfermar', emoji: '😟', color: 'warning' },
  peligro: { title: '¡Peligro! Esta dieta daña su salud', emoji: '🚨', color: 'danger' },
};

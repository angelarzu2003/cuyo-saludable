// Los nombres de las propiedades son los mismos que envía el backend.

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

/** Texto, emoji y color con que se muestra un nivel de salud. */
export interface HealthLevelInfo {
  title: string;
  emoji: string;
  color: string;
}

export type FeedbackType = 'ok' | 'warning' | 'danger';

/** Una recomendación del resultado. */
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

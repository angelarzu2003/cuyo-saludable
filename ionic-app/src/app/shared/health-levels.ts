import { HealthLevel, HealthLevelInfo } from '../interfaces';

/** Texto y color que se muestran para cada nivel de salud. */
export const HEALTH_LEVELS: Record<HealthLevel, HealthLevelInfo> = {
  excelente: { title: '¡Excelente! Tu cuyo está sano y feliz', emoji: '🥳', color: 'success' },
  buena: { title: 'Buena dieta, pero puede mejorar', emoji: '🙂', color: 'primary' },
  regular: { title: 'Dieta deficiente, podría enfermar', emoji: '😟', color: 'warning' },
  peligro: { title: '¡Peligro! Esta dieta daña su salud', emoji: '🚨', color: 'danger' },
};

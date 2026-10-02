import { HealthLevel } from './diet.model';

export type CuyoSex = 'macho' | 'hembra';

/** Datos que se llenan en el formulario de crear / editar cuyo. */
export interface CuyoForm {
  name: string;
  sex: CuyoSex;
  age_months: number;
  weight_g: number;
}

/** Cuyo tal como lo devuelve la API (tabla cuyos + su última evaluación). */
export interface Cuyo extends CuyoForm {
  id: number;
  last_score: number | null;
  last_level: HealthLevel | null;
}

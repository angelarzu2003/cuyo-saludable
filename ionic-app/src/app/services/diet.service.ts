import { Injectable } from '@angular/core';
import { CartItem, DietResult, EvaluationSummary, Food } from '../models/diet.model';
import { http } from './http';

@Injectable({
  providedIn: 'root',
})
export class DietService {
  /** Catálogo de alimentos para armar el formulario. */
  async getFoods(): Promise<Food[]> {
    const { data } = await http.get<{ foods: Food[] }>('/foods.php');
    return data.foods;
  }

  /** Envía el carrito al backend, que evalúa la dieta y la guarda en la BD. */
  async evaluate(cuyName: string, items: CartItem[]): Promise<DietResult> {
    const { data } = await http.post<{ evaluation: DietResult }>('/evaluations.php', {
      cuy_name: cuyName,
      items,
    });
    return data.evaluation;
  }

  /** Últimas evaluaciones guardadas por el usuario. */
  async getHistory(): Promise<EvaluationSummary[]> {
    const { data } = await http.get<{ evaluations: EvaluationSummary[] }>('/evaluations.php');
    return data.evaluations;
  }
}

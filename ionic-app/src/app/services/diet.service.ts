import { Injectable, inject } from '@angular/core';
import { ApiService, isNetworkError } from '../core/api.service';
import { SyncService } from '../core/sync.service';
import { EvaluationDetail, EvaluationRequest, EvaluationSummary, Food } from '../models/diet.model';

/** Alimentos y evaluaciones de dieta (api/foods.php y api/evaluations.php). */
@Injectable({ providedIn: 'root' })
export class DietService {
  private api = inject(ApiService);
  private sync = inject(SyncService);

  async getFoods(): Promise<Food[]> {
    const data = await this.api.getCached<{ foods: Food[] }>('/foods.php');
    return data.foods;
  }

  /** Historial de evaluaciones; si se pasa cuyoId, solo las de ese cuyo. */
  async getHistory(cuyoId?: number): Promise<EvaluationSummary[]> {
    const url = cuyoId ? `/evaluations.php?cuyo_id=${cuyoId}` : '/evaluations.php';
    const data = await this.api.getCached<{ evaluations: EvaluationSummary[] }>(url);
    return data.evaluations;
  }

  async getEvaluation(id: number): Promise<EvaluationDetail> {
    const data = await this.api.getCached<{ evaluation: EvaluationDetail }>(`/evaluations.php?id=${id}`);
    return data.evaluation;
  }

  /**
   * Envía la dieta al backend para evaluarla y guardarla.
   * Sin conexión, la deja en la cola offline y devuelve null (se evaluará al reconectar).
   */
  async evaluate(request: EvaluationRequest, cuyoName: string): Promise<EvaluationDetail | null> {
    try {
      const data = await this.api.post<{ evaluation: EvaluationDetail }>('/evaluations.php', request);
      return data.evaluation;
    } catch (error) {
      if (isNetworkError(error)) {
        this.sync.enqueue(request, cuyoName);
        return null;
      }
      throw error;
    }
  }

  async deleteEvaluation(id: number): Promise<void> {
    await this.api.delete(`/evaluations.php?id=${id}`);
  }
}

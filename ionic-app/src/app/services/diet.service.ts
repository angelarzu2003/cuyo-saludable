import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../core/api-endpoints';
import { isNetworkError } from '../core/api-error';
import { ApiService } from '../core/api.service';
import { SyncService } from '../core/sync.service';
import {
  EvaluationDetail,
  EvaluationListResponse,
  EvaluationRequest,
  EvaluationResponse,
  EvaluationSummary,
  Food,
  FoodListResponse,
} from '../interfaces';

/** Alimentos y evaluaciones de dieta (/api/foods y /api/evaluations). */
@Injectable({ providedIn: 'root' })
export class DietService {
  private api = inject(ApiService);
  private sync = inject(SyncService);

  async getFoods(): Promise<Food[]> {
    const data = await this.api.getCached<FoodListResponse>(ENDPOINTS.foods);
    return data.foods;
  }

  /** Historial de evaluaciones; si se pasa cuyoId, solo las de ese cuyo. */
  async getHistory(cuyoId?: number): Promise<EvaluationSummary[]> {
    const path = cuyoId ? ENDPOINTS.cuyoEvaluations(cuyoId) : ENDPOINTS.evaluations;
    const data = await this.api.getCached<EvaluationListResponse>(path);
    return data.evaluations;
  }

  async getEvaluation(id: number): Promise<EvaluationDetail> {
    const data = await this.api.getCached<EvaluationResponse>(ENDPOINTS.evaluation(id));
    return data.evaluation;
  }

  /**
   * Envía la dieta al backend para evaluarla y guardarla.
   * Sin conexión, la deja en la cola offline y devuelve null (se evaluará al reconectar).
   */
  async evaluate(request: EvaluationRequest, cuyoName: string): Promise<EvaluationDetail | null> {
    try {
      const data = await this.api.post<EvaluationResponse>(ENDPOINTS.evaluations, request);
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
    await this.api.delete(ENDPOINTS.evaluation(id));
  }
}

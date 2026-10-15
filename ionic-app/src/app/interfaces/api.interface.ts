import { Cuyo } from './cuyo.interface';
import { EvaluationDetail, EvaluationSummary } from './evaluation.interface';
import { Food } from './food.interface';
import { User } from './user.interface';

/** Tipos de error que puede producir una petición a la API. */
export type ApiErrorKind = 'network' | 'unauthorized' | 'validation' | 'not_found' | 'server';

// ===========================================================
// Modelo JSON de intercambio con la API
// Todas las respuestas comparten el mismo "sobre":
//   éxito -> { "success": true, ...datos }
//   error -> { "success": false, "message": "..." }
// ===========================================================

/** Respuesta exitosa: success = true más los datos propios del endpoint. */
export type ApiResponse<T extends object = object> = { success: true; message?: string } & T;

/** Respuesta de error (códigos 4xx y 5xx). */
export interface ApiErrorResponse {
  success: false;
  message: string;
}

/** POST /auth/login */
export type LoginResponse = ApiResponse<{ token: string; expires_at: string; user: User }>;

/** GET /health */
export type HealthResponse = ApiResponse<{ service: string; version: string; database: 'ok'; server_time: string }>;

/** GET /foods */
export type FoodListResponse = ApiResponse<{ foods: Food[] }>;

/** GET /cuyos */
export type CuyoListResponse = ApiResponse<{ cuyos: Cuyo[] }>;

/** GET /cuyos/{id} · POST /cuyos · PUT /cuyos/{id} */
export type CuyoResponse = ApiResponse<{ cuyo: Cuyo }>;

/** GET /evaluations · GET /cuyos/{id}/evaluations */
export type EvaluationListResponse = ApiResponse<{ evaluations: EvaluationSummary[] }>;

/** GET /evaluations/{id} · POST /evaluations */
export type EvaluationResponse = ApiResponse<{ evaluation: EvaluationDetail }>;

/** DELETE /cuyos/{id} · DELETE /evaluations/{id} · POST /auth/logout */
export type MessageResponse = ApiResponse<{ message: string }>;

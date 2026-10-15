/**
 * Endpoints REST de la API, relativos a la URL del servidor (ApiService.baseUrl).
 * Todas las rutas están aquí: si una cambia, solo se edita este archivo.
 */
export const ENDPOINTS = {
  health: '/health',
  login: '/auth/login',
  logout: '/auth/logout',
  foods: '/foods',
  cuyos: '/cuyos',
  cuyo: (id: number) => `/cuyos/${id}`,
  cuyoEvaluations: (cuyoId: number) => `/cuyos/${cuyoId}/evaluations`,
  evaluations: '/evaluations',
  evaluation: (id: number) => `/evaluations/${id}`,
} as const;

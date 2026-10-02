/** Usuario autenticado. */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** Respuesta de api/login.php. */
export interface LoginResponse {
  token: string;
  expires_at: string;
  user: User;
}

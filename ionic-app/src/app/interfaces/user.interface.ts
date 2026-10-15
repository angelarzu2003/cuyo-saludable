/** Usuario autenticado. */
export interface User {
  id: number;
  name: string;
  email: string;
}

/** Cuerpo del POST /auth/login. */
export interface LoginRequest {
  email: string;
  password: string;
}

import { Injectable } from '@angular/core';
import { getErrorMessage, http, TOKEN_KEY } from './http';

const USER_KEY = 'user';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface LoginResponse {
  token: string;
  expires_at: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Inicia sesión y guarda el token y el usuario en localStorage. */
  async login(email: string, password: string): Promise<void> {
    try {
      const { data } = await http.post<LoginResponse>('/login.php', { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Error al iniciar sesión'));
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

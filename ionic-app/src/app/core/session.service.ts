import { Injectable, inject, signal } from '@angular/core';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** Guarda la sesión (token + usuario) en el dispositivo. No hace peticiones. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private storage = inject(StorageService);

  readonly user = signal<User | null>(this.storage.get<User>(USER_KEY));

  get token(): string | null {
    return this.storage.get<string>(TOKEN_KEY);
  }

  start(token: string, user: User): void {
    this.storage.set(TOKEN_KEY, token);
    this.storage.set(USER_KEY, user);
    this.user.set(user);
  }

  clear(): void {
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
    this.user.set(null);
  }
}

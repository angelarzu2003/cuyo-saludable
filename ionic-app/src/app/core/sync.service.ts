import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService, isNetworkError } from './api.service';
import { NotifyService } from './notify.service';
import { SessionService } from './session.service';
import { StorageService } from './storage.service';
import { EvaluationRequest, PendingEvaluation } from '../interfaces';

const QUEUE_KEY = 'pendingEvaluations';
const RETRY_INTERVAL_MS = 30_000;

/**
 * Operación offline: cola de evaluaciones hechas SIN conexión.
 * Se guardan en el dispositivo y se envían al servidor cuando vuelve la conexión
 * (evento "online", cada 30 segundos o manualmente desde la app).
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private session = inject(SessionService);
  private notify = inject(NotifyService);

  readonly pending = signal<PendingEvaluation[]>(this.storage.get<PendingEvaluation[]>(QUEUE_KEY) ?? []);
  readonly isSyncing = signal(false);

  /** Emite cada vez que se sincroniza algo, para que las páginas recarguen sus datos. */
  readonly synced$ = new Subject<void>();

  constructor() {
    window.addEventListener('online', () => this.sync());
    setInterval(() => this.sync(), RETRY_INTERVAL_MS);
  }

  /** Guarda una evaluación en la cola local. */
  enqueue(request: EvaluationRequest, cuyoName: string): void {
    const item: PendingEvaluation = {
      ...request,
      cuyo_name: cuyoName,
      local_id: Date.now(),
      created_at: new Date().toISOString(),
    };
    this.save([...this.pending(), item]);
  }

  discard(localId: number): void {
    this.save(this.pending().filter((item) => item.local_id !== localId));
  }

  clear(): void {
    this.save([]);
  }

  /** Envía al servidor las evaluaciones pendientes, en orden. */
  async sync(): Promise<void> {
    if (this.isSyncing() || this.pending().length === 0 || !this.session.token) {
      return;
    }

    this.isSyncing.set(true);
    let syncedCount = 0;

    try {
      for (const item of this.pending()) {
        try {
          await this.api.post('/evaluations.php', { cuyo_id: item.cuyo_id, items: item.items });
          syncedCount++;
        } catch (error) {
          // Sigue sin conexión: se detiene y se reintentará más tarde
          if (isNetworkError(error)) {
            break;
          }
          // El servidor la rechazó (ej. el cuyo fue eliminado): se descarta y se avisa
          await this.notify.error(error, `No se pudo sincronizar la evaluación de ${item.cuyo_name}`);
        }
        this.discard(item.local_id);
      }
    } finally {
      this.isSyncing.set(false);
    }

    if (syncedCount > 0) {
      await this.notify.success(`☁️ Se sincronizaron ${syncedCount} evaluación(es) pendientes`);
      this.synced$.next();
    }
  }

  private save(queue: PendingEvaluation[]): void {
    this.pending.set(queue);
    this.storage.set(QUEUE_KEY, queue);
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Cuyo, CuyoForm } from '../models/cuyo.model';

/** CRUD de cuyos contra api/cuyos.php. Las lecturas usan caché para funcionar offline. */
@Injectable({ providedIn: 'root' })
export class CuyoService {
  private api = inject(ApiService);

  async list(): Promise<Cuyo[]> {
    const data = await this.api.getCached<{ cuyos: Cuyo[] }>('/cuyos.php');
    return data.cuyos;
  }

  async get(id: number): Promise<Cuyo> {
    const data = await this.api.getCached<{ cuyo: Cuyo }>(`/cuyos.php?id=${id}`);
    return data.cuyo;
  }

  async create(form: CuyoForm): Promise<Cuyo> {
    const data = await this.api.post<{ cuyo: Cuyo }>('/cuyos.php', form);
    return data.cuyo;
  }

  async update(id: number, form: CuyoForm): Promise<Cuyo> {
    const data = await this.api.put<{ cuyo: Cuyo }>(`/cuyos.php?id=${id}`, form);
    return data.cuyo;
  }

  async remove(id: number): Promise<void> {
    await this.api.delete(`/cuyos.php?id=${id}`);
  }
}

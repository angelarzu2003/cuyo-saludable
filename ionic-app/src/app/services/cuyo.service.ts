import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../core/api-endpoints';
import { ApiService } from '../core/api.service';
import { Cuyo, CuyoForm, CuyoListResponse, CuyoResponse } from '../interfaces';

/** CRUD de cuyos contra /api/cuyos. Las lecturas usan caché para funcionar offline. */
@Injectable({ providedIn: 'root' })
export class CuyoService {
  private api = inject(ApiService);

  async list(): Promise<Cuyo[]> {
    const data = await this.api.getCached<CuyoListResponse>(ENDPOINTS.cuyos);
    return data.cuyos;
  }

  async get(id: number): Promise<Cuyo> {
    const data = await this.api.getCached<CuyoResponse>(ENDPOINTS.cuyo(id));
    return data.cuyo;
  }

  async create(form: CuyoForm): Promise<Cuyo> {
    const data = await this.api.post<CuyoResponse>(ENDPOINTS.cuyos, form);
    return data.cuyo;
  }

  async update(id: number, form: CuyoForm): Promise<Cuyo> {
    const data = await this.api.put<CuyoResponse>(ENDPOINTS.cuyo(id), form);
    return data.cuyo;
  }

  async remove(id: number): Promise<void> {
    await this.api.delete(ENDPOINTS.cuyo(id));
  }
}

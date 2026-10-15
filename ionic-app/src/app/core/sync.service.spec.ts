import { TestBed } from '@angular/core/testing';
import { ApiError } from './api-error';
import { ApiService } from './api.service';
import { NotifyService } from './notify.service';
import { SessionService } from './session.service';
import { SyncService } from './sync.service';

describe('SyncService (cola offline)', () => {
  let sync: SyncService;
  const api = { post: vi.fn() };
  const notify = { success: vi.fn(), error: vi.fn() };
  const request = { cuyo_id: 1, items: [{ food_id: 1, quantity: 2 }] };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: NotifyService, useValue: notify },
        { provide: SessionService, useValue: { token: 'token-de-prueba' } },
      ],
    });
    sync = TestBed.inject(SyncService);
  });

  it('guarda la evaluación en la cola y en el dispositivo', () => {
    sync.enqueue(request, 'Pelusa');

    expect(sync.pending().length).toBe(1);
    expect(sync.pending()[0].cuyo_name).toBe('Pelusa');
    expect(JSON.parse(localStorage.getItem('pendingEvaluations')!).length).toBe(1);
  });

  it('al sincronizar envía los pendientes y vacía la cola', async () => {
    api.post.mockResolvedValue({});
    sync.enqueue(request, 'Pelusa');

    await sync.sync();

    expect(api.post).toHaveBeenCalledWith('/evaluations', request);
    expect(sync.pending().length).toBe(0);
    expect(notify.success).toHaveBeenCalled();
  });

  it('si sigue sin conexión, conserva los pendientes para reintentar', async () => {
    api.post.mockRejectedValue(new ApiError('Sin conexión', 'network'));
    sync.enqueue(request, 'Pelusa');

    await sync.sync();

    expect(sync.pending().length).toBe(1);
  });

  it('si el servidor la rechaza (ej. cuyo eliminado), la descarta y avisa', async () => {
    api.post.mockRejectedValue(new ApiError('El cuyo no existe', 'not_found'));
    sync.enqueue(request, 'Pelusa');

    await sync.sync();

    expect(sync.pending().length).toBe(0);
    expect(notify.error).toHaveBeenCalled();
  });
});

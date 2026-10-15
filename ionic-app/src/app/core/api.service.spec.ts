import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular/lazy';
import { ApiError } from './api-error';
import { apiErrorInterceptor } from './api-error.interceptor';
import { ApiService } from './api.service';
import { authInterceptor } from './auth.interceptor';
import { ConnectivityService } from './connectivity.service';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';
import { SessionService } from './session.service';

describe('ApiService + interceptores (cliente HTTP de la API)', () => {
  let api: ApiService;
  let http: HttpTestingController;
  const session = { token: 'token-de-prueba' as string | null, clear: vi.fn() };
  const router = { navigateByUrl: vi.fn() };
  const connectivity = { markOnline: vi.fn(), markOffline: vi.fn() };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    session.token = 'token-de-prueba';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: session },
        { provide: Router, useValue: router },
        { provide: ConnectivityService, useValue: connectivity },
        { provide: LoadingController, useValue: {} },
      ],
    });
    api = TestBed.inject(ApiService);
    api.setBaseUrl('http://servidor/api/');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arma la URL REST y agrega el token Bearer', async () => {
    const promise = api.get<{ success: true }>('/cuyos/5');

    const req = http.expectOne('http://servidor/api/cuyos/5');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush({ success: true });

    await expect(promise).resolves.toEqual({ success: true });
    expect(connectivity.markOnline).toHaveBeenCalled();
  });

  it('envía el cuerpo JSON en POST', async () => {
    const promise = api.post('/evaluations', { cuyo_id: 1, items: [] });

    const req = http.expectOne('http://servidor/api/evaluations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cuyo_id: 1, items: [] });
    req.flush({ success: true });
    await promise;
  });

  it('convierte un 400 en ApiError de validación con el mensaje del servidor', async () => {
    const promise = api.post('/cuyos', {});
    http.expectOne('http://servidor/api/cuyos').flush(
      { success: false, message: 'El nombre es obligatorio' },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(promise).rejects.toEqual(new ApiError('El nombre es obligatorio', 'validation'));
  });

  it('sin respuesta del servidor: ApiError "network" y marca sin conexión', async () => {
    const promise = api.get('/foods');
    http.expectOne('http://servidor/api/foods').error(new ProgressEvent('error'));

    const error = (await promise.catch((e: unknown) => e)) as ApiError;
    expect(error.kind).toBe('network');
    expect(connectivity.markOffline).toHaveBeenCalled();
  });

  it('401 con sesión: cierra la sesión y vuelve al login', async () => {
    const promise = api.get('/cuyos');
    http.expectOne('http://servidor/api/cuyos').flush(
      { success: false, message: 'Sesión inválida o expirada' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    expect(session.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('getCached devuelve la última copia guardada cuando no hay conexión', async () => {
    const first = api.getCached('/foods');
    http.expectOne('http://servidor/api/foods').flush({ success: true, foods: [{ id: 1 }] });
    await first;

    const offline = api.getCached('/foods');
    http.expectOne('http://servidor/api/foods').error(new ProgressEvent('error'));

    await expect(offline).resolves.toEqual({ success: true, foods: [{ id: 1 }] });
  });

  it('muestra la barra de carga mientras la petición está en curso (también si falla)', async () => {
    const loading = TestBed.inject(LoadingService);

    const ok = api.get('/cuyos');
    const failing = api.delete('/cuyos/9');
    expect(loading.isBusy()).toBe(true);

    http.expectOne('http://servidor/api/cuyos').flush({ success: true });
    await ok;
    expect(loading.isBusy()).toBe(true); // todavía falta el DELETE

    http.expectOne('http://servidor/api/cuyos/9').flush(
      { success: false, message: 'El cuyo no existe' },
      { status: 404, statusText: 'Not Found' },
    );
    await failing.catch(() => undefined);
    expect(loading.isBusy()).toBe(false);
  });
});
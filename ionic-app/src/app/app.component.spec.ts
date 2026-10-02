import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { SyncService } from './core/sync.service';

describe('AppComponent', () => {
  const syncMock = { sync: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: SyncService, useValue: syncMock },
        { provide: SwUpdate, useValue: { isEnabled: false } },
      ],
    }).compileComponents();
  });

  it('se crea e intenta sincronizar los pendientes al iniciar', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;

    expect(app).toBeTruthy();
    expect(syncMock.sync).toHaveBeenCalled();
  });
});

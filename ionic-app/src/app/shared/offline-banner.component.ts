import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { ConnectivityService } from '../core/connectivity.service';
import { SyncService } from '../core/sync.service';

/** Franja que avisa cuando la app trabaja sin conexión. Va dentro del <ion-header>. */
@Component({
  selector: 'app-offline-banner',
  imports: [IonicModule],
  template: `
    @if (!connectivity.isOnline()) {
      <div class="offline-banner">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        Sin conexión · mostrando datos guardados
        @if (sync.pending().length > 0) {
          · {{ sync.pending().length }} pendiente(s)
        }
      </div>
    }
  `,
  styles: `
    .offline-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #5c4400;
      background: var(--ion-color-warning-tint);
    }
  `,
})
export class OfflineBannerComponent {
  readonly connectivity = inject(ConnectivityService);
  readonly sync = inject(SyncService);
}

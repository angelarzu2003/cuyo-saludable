import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { SyncService } from '../../core/sync.service';

/** Contenedor con la barra de pestañas inferior. Cada pestaña es una ruta hija. */
@Component({
  selector: 'app-tabs',
  imports: [IonicModule],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="cuyos">
          <ion-icon name="paw"></ion-icon>
          <ion-label>Mis cuyos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="evaluar">
          <ion-icon name="nutrition"></ion-icon>
          <ion-label>Evaluar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="historial">
          <ion-icon name="time"></ion-icon>
          <ion-label>Historial</ion-label>
          @if (sync.pending().length > 0) {
            <ion-badge color="warning">{{ sync.pending().length }}</ion-badge>
          }
        </ion-tab-button>

        <ion-tab-button tab="perfil">
          <ion-icon name="person-circle"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  readonly sync = inject(SyncService);
}

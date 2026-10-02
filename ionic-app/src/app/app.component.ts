import { Component, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { addIcons } from 'ionicons';
import {
  add,
  addCircle,
  alertCircle,
  checkmarkCircle,
  closeCircle,
  cloudDoneOutline,
  cloudOfflineOutline,
  cloudUploadOutline,
  createOutline,
  logOutOutline,
  nutrition,
  paw,
  personCircle,
  removeCircleOutline,
  syncOutline,
  time,
  trashOutline,
} from 'ionicons/icons';
import { SyncService } from './core/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    // Íconos incluidos en el bundle: así se ven aunque no haya conexión
    addIcons({
      add, addCircle, alertCircle, checkmarkCircle, closeCircle, cloudDoneOutline, cloudOfflineOutline,
      cloudUploadOutline, createOutline, logOutOutline, nutrition, paw, personCircle, removeCircleOutline,
      syncOutline, time, trashOutline,
    });

    // Al abrir la app se intenta enviar lo que haya quedado pendiente sin conexión
    inject(SyncService).sync();

    // Si se publicó una versión nueva de la app, se recarga para usarla
    const swUpdate = inject(SwUpdate);
    if (swUpdate.isEnabled) {
      swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          document.location.reload();
        }
      });
    }
  }
}

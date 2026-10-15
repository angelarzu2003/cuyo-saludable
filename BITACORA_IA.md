# 📓 Bitácora de desarrollo asistido por IA — Cuyo Saludable

| Campo            | Detalle                                                                 |
|------------------|-------------------------------------------------------------------------|
| Proyecto         | Cuyo Saludable v1.2.0 (Ionic + Angular, PHP, MySQL)                     |
| Estudiante       | Angel Arzu Herrera Sierra                                               |
| Herramienta de IA| **Claude Code** (modelo Claude Opus 5.5, de Anthropic), extensión de VS Code |
| Periodo          | 23/09/2026 – 15/10/2026                                                 |

## Metodología de trabajo

Cada sesión siguió el mismo ciclo:

1. **Petición:** el estudiante describe en lenguaje natural lo que necesita.
2. **Análisis:** la IA lee el código existente y revisa el entorno (versiones de Node, PHP, XAMPP, etc.) antes de cambiar nada.
3. **Implementación:** la IA escribe el código siguiendo las convenciones del proyecto.
4. **Verificación:** la IA prueba su propio trabajo antes de darlo por terminado:
   - `php -l` (sintaxis) y `curl` contra cada endpoint, incluidos los casos de error;
   - compilación de Angular (`ng build`) y pruebas unitarias (`ng test`);
   - prueba de punta a punta en el navegador con Playwright (Edge), con capturas de pantalla.
5. **Registro:** un commit en Git por etapa y una entrada en esta bitácora.

---

## Sesión 1 — 23/09/2026 · De "login + formulario" a evaluador de dietas

### Petición del estudiante
> *"Analiza este proyecto. Es un login donde al autenticarte, te manda a un formulario donde los datos ingresados se mandan a una BD. Quiero que basándote en la misma lógica (Login, formulario) modifiques el proyecto, para que sea el login, y al entrar te salga un formulario referente a cuánta comida le debes dar a un Cuyo para que sea saludable [...] como un 'carrito de compras' y al final con un botón 'evaluar' [...]. Haz que el frontend se vea amigable, limpio y equilibrado. El código hazlo LIMPIO, FÁCIL DE LEER Y ENTENDER Y CON BUENAS PRÁCTICAS, dado que lo proyectaré como examen [...]. También quiero levantes la página."*

### Qué hizo la IA
- Analizó el proyecto original: PHP con un login por token, y Ionic con Axios y guards.
- Diseñó el catálogo de alimentos en la BD (tabla `foods`) con categoría y vitamina C por porción.
- Separó las **reglas de nutrición** en un archivo propio (`diet_evaluator.php`), para que fueran fáciles de explicar.
- Creó la pantalla con tarjetas de alimentos y botones +/−, una barra de "carrito" y un modal con el resultado.
- Reorganizó el backend en `api/`, con funciones compartidas en `helpers.php`.
- Levantó MySQL y Apache de XAMPP y el servidor de desarrollo de Angular.

### Decisiones técnicas
| Decisión | Motivo |
|---|---|
| La evaluación se calcula en el **backend** | Una sola fuente de verdad; el cliente no puede alterar el puntaje |
| Uso de *signals* de Angular | La app no usa zone.js, así que la vista no se actualizaría sola tras un `await` |
| Validación del token en cada endpoint (`require_auth`) | El proyecto original guardaba el token, pero nunca lo validaba en el servidor |

### Problemas encontrados y cómo se resolvieron
| Problema | Solución |
|---|---|
| Node 22.14 instalado, pero Angular 22 exige 22.22.3 o superior | Usar un Node 24 portable con `npx -p node@24`, sin modificar el sistema |
| `SELECT ... portion` fallaba: `portion` es palabra reservada en MariaDB | Renombrar la columna a `portion_size` |
| El emoji 🫑 es un pimiento verde, pero el alimento decía "Pimiento rojo" | Renombrarlo a "Pimiento" |

### Verificación
- `curl`: login correcto e incorrecto, petición sin token, validaciones y método no permitido (405).
- Playwright: login → carrito → evaluación → historial, en escritorio y en tamaño celular, sin errores en consola.

### Petición de seguimiento
> *"PS C:\...\proyecto> npm start -- --port 8100 → npm error ENOENT ... package.json"* (el estudiante pegó el error)

La IA explicó la causa: el comando se ejecutó en la carpeta raíz, no en `ionic-app/`. También advirtió que el Node instalado es incompatible y que el puerto ya estaba ocupado.

---

## Sesión 2 — 23/09/2026 · Despliegue solo con XAMPP

### Petición del estudiante
> *"Acóplalo a que se levante mediante XAMPP ya que lo levantaría desde XAMPP en mi laptop."*

### Qué hizo la IA
- Configuró el build de producción para que genere la app compilada en `proyecto/app/` con `baseHref: /proyecto/app/`.
- Hizo que la API se llame con una ruta relativa (`/proyecto/api`), porque Apache sirve app y API desde el mismo lugar.
- Agregó un `.htaccess` para que recargar rutas como `/app/tabs/...` no dé error 404, e `index.php` para redirigir `/proyecto` a la app.
- Resultado: en la laptop solo se necesita XAMPP, sin Node.

---

## Sesión 3 — 01/10/2026 · Versión 1.0 (requisitos de la entrega)

### Petición del estudiante
> *"Ahora harás esto. Entregarán una versión 1.0 de su aplicación con: Proyecto Ionic funcional. Navegación. Modelo de datos. CRUD. Persistencia. Manejo de errores. Operación offline básica. Repositorio Git. APK o ejecución demostrable. README.md. Bitácora de desarrollo asistido por IA."*

### Plan propuesto por la IA
| Requisito | Propuesta |
|---|---|
| CRUD | Nueva entidad **Cuyo** (mascota) con CRUD completo; las evaluaciones pertenecen a un cuyo |
| Navegación | 4 pestañas + páginas de detalle y formulario |
| Offline | Caché de lecturas + cola de evaluaciones que se sincroniza al reconectar |
| Git | Repositorio con commits por etapa y tag `v1.0.0` |

### Qué hizo la IA
1. **Respaldó la BD** antes de cambiar el esquema y **migró** las 2 evaluaciones que el estudiante ya había hecho, asignándolas al cuyo "Cui".
2. **Backend:** creó `cuyos.php` (CRUD completo con validación), amplió `evaluations.php` (filtro, detalle y eliminación), agregó `logout.php` y un manejador global de excepciones.
3. **Frontend:** reestructuró la app en `core/`, `models/`, `services/`, `shared/` y `pages/`, con 9 páginas *standalone*.
4. **Errores:** creó `ApiError` con tipos de error, manejo de la sesión expirada, `GlobalErrorHandler` y formularios reactivos con validaciones.
5. **Offline:** creó `ApiService.getCached`, la cola `SyncService`, `ConnectivityService`, el aviso offline y el Service Worker.
6. **Pruebas:** 11 pruebas unitarias con Vitest y una prueba de punta a punta con Playwright.
7. **Documentación:** README y esta bitácora.

### Problemas encontrados y cómo se resolvieron
| Problema | Cómo se detectó | Solución |
|---|---|---|
| En PHP, una `const` declarada después del `match` no existía al ejecutarse | Revisión del código | Mover la constante antes de su uso |
| **Sin red, el selector de cuyo no abría.** Ionic descarga cada componente (popover, alertas) la primera vez que se usa | Prueba de punta a punta en modo offline | **Service Worker** de Angular que guarda todos los archivos de la app, más los íconos incluidos en el bundle |
| **Con el Service Worker, la falta de red llegaba como un error 504**, no como "sin conexión", y la evaluación no entraba en la cola | Prueba de punta a punta en modo offline | Tratar 502/503/504 como "servidor inalcanzable" en `ApiService` |
| En el APK no sirve `/proyecto/api` (en el celular, "localhost" es el propio teléfono) | Análisis | Configuración de build `mobile` y URL del servidor editable desde **Perfil** |
| Errores *del test*, no de la app: Ionic mueve el `aria-label`, `'Agua'` también encontraba "Aguacate", y las pestañas recuerdan la última página abierta | Capturas de pantalla | Ajustar los selectores del test |

### Verificación final (resultado de la prueba de punta a punta)
```
✔ login incorrecto -> toast: Credenciales inválidas
✔ lista de cuyos: Coco, Cui, Pelusa
✔ formulario inválido muestra 2 campos con error
✔ CREATE ok -> toast: ¡Copito fue registrado!
✔ UPDATE ok (form precargado con "Copito") -> ♂ Macho · 4 meses · 520 g
✔ resultado: 🥳 ¡Excelente! Tu cuyo está sano y feliz
✔ detalle evaluación: comió 5 alimentos
✔ service worker activo: true
✔ offline banner visible: true
✔ offline lista de cuyos (caché): 4 cuyos
✔ evaluar offline -> toast: 📴 Sin conexión: la dieta de Pelusa se evaluará al reconectar
✔ pendientes en historial: 1
✔ recarga completa SIN conexión -> la app abre y conserva el pendiente
✔ crear cuyo offline -> toast: Sin conexión con el servidor. Inténtalo cuando vuelvas a estar en línea.
✔ tras reconectar, pendientes: 0 | Pelusa en guardadas: 1
✔ DELETE ok -> toast: Cuyo eliminado
✔ logout ok -> /proyecto/app/login
✔ ruta protegida sin sesión -> /proyecto/app/login
errores de consola: []
```
Pruebas unitarias: **4 archivos, 11 pruebas, todas aprobadas**.

---

## Sesión 4 — 01/10/2026 · Interfaces en una sola carpeta

### Petición del estudiante
> *"Quiero que las interfaces las pongas en una carpeta juntas. Reestructura el proyecto para eso."*

### Qué hizo la IA
- Buscó **todas** las interfaces y tipos del frontend. Estaban repartidas en `models/`, `auth.service.ts` (`LoginResponse`), `evaluate.page.ts` (`Section`) y `api.service.ts` (`ApiErrorKind`).
- Las reunió en `src/app/interfaces/`, con un archivo por tema (`user`, `cuyo`, `food`, `evaluation`, `api`) y un `index.ts` que las exporta todas. Así, cualquier archivo las importa con `import { Cuyo } from '../interfaces'`.
- Renombró `Section` a `FoodSection`, que describe mejor lo que es.
- Movió la constante `HEALTH_LEVELS` a `shared/health-levels.ts`, porque es un dato y no una interfaz. Su forma quedó definida como la interfaz `HealthLevelInfo`.
- Usó `git mv` para conservar el historial de los archivos movidos.

### Verificación
- Búsqueda: no queda ninguna `interface` ni `type` fuera de `interfaces/`.
- Compilación correcta, 11/11 pruebas unitarias y prueba de punta a punta completa sin errores.

---

## Sesión 5 — 10/10/2026 · Cliente móvil conectado a un servicio web (Unidad II)

### Petición del estudiante (prompt original, textual)
> *"Convertir la aplicación de la Unidad I (esta) en un cliente móvil conectado a un servicio web. Se debe entregar modificado el proyecto con lo siguiente: Diagrama Cliente → API → Base de datos. Lista de endpoints requeridos. Métodos HTTP utilizados. Modelo JSON de intercambio de información. Servicio Angular preparado para consumir la API. Explicación de la arquitectura propuesta. Evidencia de uso de IA para analizar o mejorar la arquitectura."*

### Prompts por etapa
El trabajo se dividió en pasos. Cada prompt resume lo que se le pidió a la IA en ese paso:

| # | Etapa | Prompt |
|---|-------|--------|
| 1 | Análisis | *"Analizando la estructura actual del proyecto (api/, ionic-app/src/app/core, services, interfaces), dime qué partes ya funcionan como cliente → API → BD y qué le falta para ser un servicio web REST bien definido."* |
| 2 | Diagnóstico del cliente | *"Revisa `api.service.ts`: ¿es la forma recomendada en Angular de consumir una API? Propón cómo separar el token y el manejo de errores del código de las peticiones."* |
| 3 | Mejora de la API | *"Mejora las rutas de la API para que sean REST (`/cuyos/5` en lugar de `cuyos.php?id=5`) sin romper las URLs que ya existen ni el despliegue en XAMPP."* |
| 4 | Nuevo endpoint | *"Agrega un endpoint `GET /health` sin token que confirme que la API y la base de datos responden, y úsalo en Perfil para probar la URL del servidor."* |
| 5 | Seguridad | *"Revisa si algún archivo interno de la API (config.php, helpers.php) se puede abrir desde el navegador y bloquéalo. Haz que las rutas que no existen respondan 404 en JSON."* |
| 6 | Servicio Angular | *"Edita el ApiService para usar HttpClient en lugar de Axios, con un interceptor que agregue el token y otro que convierta los errores en ApiError. Las páginas no deben cambiar."* |
| 7 | Modelo JSON | *"Define en `interfaces/` el formato de todas las respuestas de la API (`ApiResponse<T>`) y un archivo con todas las rutas (`ENDPOINTS`)."* |
| 8 | Pruebas | *"Escribe pruebas unitarias del cliente HTTP con HttpTestingController (token, 400, sin conexión, 401 y caché) y prueba todos los endpoints con curl, incluidos los errores."* |
| 9 | Documentación | *"Con lo anterior, redacta ARQUITECTURA.md: diagrama Cliente → API → BD, lista de endpoints, métodos HTTP, modelo JSON con ejemplos reales, servicio Angular y explicación de la arquitectura."* |

### Lo que encontró la IA en el análisis (etapas 1 y 2)
| Hallazgo | Riesgo / problema | Mejora aplicada |
|---|---|---|
| La app **ya** era cliente → API PHP → MySQL, pero las URLs eran nombres de archivo (`cuyos.php?id=5`) | La API dependía de cómo estaban guardados los archivos, no de los recursos | Rutas REST en `api/.htaccess`: `/cuyos/5`, `/cuyos/5/evaluations`, `/auth/login`... |
| El cliente usaba **Axios**, una librería externa, y el token y los errores estaban dentro de `ApiService` | No es la forma recomendada en Angular, y cada responsabilidad nueva haría crecer el mismo archivo | `HttpClient` + interceptores `authInterceptor` y `apiErrorInterceptor`; se quitó la dependencia `axios` |
| Las rutas estaban escritas a mano en cada servicio (`'/cuyos.php?id=' + id`) | Un cambio de ruta obligaba a buscarla en varios archivos | `core/api-endpoints.ts` con todas las rutas |
| El formato de las respuestas solo estaba "en la cabeza" (`{ cuyos: Cuyo[] }` escrito en cada llamada) | No había un contrato documentado | `ApiResponse<T>` y un tipo por respuesta en `interfaces/api.interface.ts` |
| `config.php` y `helpers.php` se podían pedir por URL | Exponer archivos internos no es buena práctica | `403` con `<FilesMatch>` en `.htaccess` |
| Una ruta inexistente devolvía la página HTML 404 de Apache | El cliente espera siempre JSON | `not_found.php` → `404` en JSON |
| No había forma de comprobar desde el celular si la URL del servidor era correcta | En el APK, una IP mal escrita solo se descubría al fallar el login | `GET /health` + botón **Probar conexión** en Perfil |

### Decisiones técnicas
| Decisión | Motivo |
|---|---|
| Rutas REST con `mod_rewrite` en lugar de un *router* PHP nuevo | Cambio mínimo: los endpoints PHP no se reescriben, XAMPP ya trae `mod_rewrite` y las URLs antiguas siguen funcionando |
| `ApiService` sigue devolviendo `Promise` (`firstValueFrom`) | Las páginas ya usan `async/await`; así el cambio de Axios a HttpClient no tocó ninguna página |
| El *timeout* (8 s) se aplica en el interceptor | Todas las peticiones lo tienen, sin repetirlo en cada servicio |
| `GET /cuyos/{id}/evaluations` solo acepta GET | Es una vista del historial; las evaluaciones se crean siempre en `POST /evaluations` |
| La documentación usa respuestas **reales** de la API | Los ejemplos JSON se copiaron de `curl`, no se inventaron |

### Problemas encontrados y cómo se resolvieron
| Problema | Cómo se detectó | Solución |
|---|---|---|
| XAMPP estaba apagado, así que no se podía probar la API | `curl` sin respuesta | Se encendieron Apache y MySQL antes de cambiar nada |
| Error de compilación del test: `'error' is of type 'unknown'` (TS18046) | `ng test` | Indicar el tipo del error capturado (`as ApiError`) |
| En la prueba sin conexión, la consola muestra `504 (Gateway Timeout)` | Prueba de punta a punta | Es lo esperado: lo genera el Service Worker sin red, y el interceptor lo trata como `'network'` |

### Verificación
**API (`curl`):** las 14 rutas REST respondieron como se esperaba: `200`/`201` en éxito, `400` validación, `401` sin token o tras logout, `404` cuyo inexistente y ruta inexistente, `405` con `PATCH`, `403` para `config.php` y `helpers.php`. Las URLs antiguas (`cuyos.php?id=1`) siguen respondiendo `200`, y el *preflight* `OPTIONS` devuelve las cabeceras CORS.

**Pruebas unitarias:** 5 archivos, **17 pruebas aprobadas** (11 anteriores y 6 nuevas de `api.service.spec.ts`). `ng lint` sin errores. `ng build` regeneró `app/`.

**Prueba de punta a punta (Playwright + Edge, contra XAMPP):**
```
✔ login + lista de cuyos: Coco, Cui, Pelusa
✔ CREATE -> ¡Copito fue registrado!
✔ detalle del cuyo 14
✔ Probar conexión -> ✅ Cuyo Saludable API v1.1.0 · base de datos ok
✔ historial cargado
✔ offline: lista desde caché: 3 cuyos
✔ DELETE -> Cuyo eliminado
✔ logout -> /login

Llamadas a la API:
  POST /api/auth/login
  GET /api/cuyos
  POST /api/cuyos
  GET /api/cuyos/14
  GET /api/cuyos/14/evaluations
  GET /api/health
  GET /api/evaluations
  DELETE /api/cuyos/14
  POST /api/auth/logout
```
La lista confirma que la app ya solo usa las rutas REST nuevas.

### Resultado
Documento [`ARQUITECTURA.md`](ARQUITECTURA.md) con los 7 entregables de la Unidad II, y la versión **v1.1.0** del proyecto.

---

## Sesión 6 — 14/10/2026 y 15/10/2026 · Conectar la app Ionic con una API REST (evidencias)

### Petición del estudiante (prompts textuales)
> *"Si quiero hacer esto: Conectar la aplicación Ionic con una API REST. Entregarán: Petición GET. Petición POST. PUT/PATCH. DELETE. Servicios Angular. Manejo de respuestas y errores. Loading durante las solicitudes. Capturas o video del funcionamiento. Código subido a Git. ¿Qué falta por hacer?"*

> *"Haz los videos y/o capturas del funcionamiento, puedes instalar lo que ocupes para hacerlo de forma autónoma. Además haz las cosas que faltan."*

### Análisis de la IA: qué faltaba
| Requisito | Estado encontrado |
|---|---|
| GET, POST, PUT, DELETE, servicios, errores | Ya cumplidos desde la v1.1 |
| Loading | **Incompleto:** los DELETE, la carga del formulario de edición y "Probar conexión" no tenían indicador |
| Capturas o video | **Faltaban:** no había ninguno en el proyecto |
| Git | **Pendiente:** los cambios de la v1.1 no tenían commit y el repositorio no tiene remoto |

### Qué hizo la IA
1. **Loading en dos niveles:**
   - `loadingInterceptor` + `LoadingService`: una barra de progreso global que aparece en **todas** las peticiones.
   - `LoadingService.run('Eliminando...')` en los 3 DELETE.
   - Spinner al cargar los datos para editar, y botones "Evaluando..." y "Probando...".
2. **Prueba unitaria nueva:** la barra se enciende durante la petición y se apaga aunque falle (18 pruebas en total).
3. **Capturas y video automáticos:** script `docs/evidencias/generar-evidencias.mjs` (Playwright + Edge, contra XAMPP), con 27 capturas y un video MP4 de 1 min 19 s.
   - Agrega un **panel inferior** con cada petición (método, ruta, código HTTP y JSON).
   - Agrega un **retraso de 1.2 s** para que el loading se alcance a ver.
   - Se instalaron `playwright-core` y `ffmpeg-static` en una carpeta temporal, sin tocar las dependencias del proyecto.
4. **Documento** [`EVIDENCIAS.md`](EVIDENCIAS.md): cada requisito con su código y sus capturas.

### Problemas encontrados al revisar las capturas
La IA revisó cada captura antes de darla por buena:

| Problema | Cómo se detectó | Solución |
|---|---|---|
| **Al eliminar, la alerta de confirmación se quedaba abierta** detrás de "Eliminando..." | Captura 19 | Era un detalle real de la app: Ionic espera la promesa del botón antes de cerrar la alerta. Se cambió a `handler: () => void this.delete()` |
| La captura del PUT mostraba los datos **viejos** (520 g) | Captura 13 | El script tomaba la foto antes de que el detalle recargara; ahora espera a ver "610 g" |
| La captura "sin conexión" no mostraba el toast | Captura 22 y un script de diagnóstico | El script recargaba la página y cortaba la red; el componente `ion-toast` se descarga la primera vez que se usa y sin red no pudo cargarse. En uso real no pasa: el Service Worker o el APK ya tienen esos archivos (ver Sesión 3). Se cambió el script para navegar **dentro** de la app, como un usuario |
| Ionic deja páginas ocultas en su pila y el script encontraba la copia oculta | Error de Playwright | Filtrar solo los elementos visibles |
| Faltaba el `ffmpeg` de Playwright para grabar video | Mensaje de error | `playwright install ffmpeg` |

### Verificación
- `ng test`: **5 archivos, 18 pruebas aprobadas**. `ng lint` sin errores. `ng build` regeneró `app/`.
- Recorrido automatizado de **27 pasos** completo, con **0 errores de JavaScript** en la página.

---

## Uso responsable de la IA

- **Lo generado por la IA se verificó:** ningún cambio se dio por terminado sin compilarlo, ejecutarlo y probarlo, incluidos los casos de error.
- **Los datos del estudiante se protegieron:** antes de cambiar el esquema se respaldó la BD y se migraron sus evaluaciones.
- **No se modificó el sistema sin permiso:** por ejemplo, se usó un Node portable en lugar de actualizar el Node instalado.
- **Límites de la IA:** la IA no tiene acceso a GitHub ni al Android SDK de este equipo. Subir el repositorio y compilar el APK requieren acciones del estudiante (ver README).

---

## Reflexión del estudiante

> ✍️ *Sección para completar por el estudiante.*

- **¿Qué partes entendí y puedo explicar sin ayuda?**
- **¿Qué cambié o corregí de lo que propuso la IA, y por qué?**
- **¿Qué aprendí? (ej. Service Worker, signals, transacciones, CORS…)**
- **¿Qué haría diferente o qué mejoraría en una versión 1.1?**

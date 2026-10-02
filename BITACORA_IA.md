# 📓 Bitácora de desarrollo asistido por IA — Cuyo Saludable

| Campo            | Detalle                                                                 |
|------------------|-------------------------------------------------------------------------|
| Proyecto         | Cuyo Saludable v1.0.0 (Ionic + Angular, PHP, MySQL)                     |
| Estudiante       | Angel Arzu Herrera Sierra                                               |
| Herramienta de IA| **Claude Code** (modelo Claude Opus 5.5, de Anthropic), extensión de VS Code |
| Periodo          | 23/09/2026 – 01/10/2026                                                 |

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

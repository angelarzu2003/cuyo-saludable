# 🐹 Cuyo Saludable

App para evaluar si la dieta diaria de un cuyo es saludable.
El usuario inicia sesión, arma el menú de su cuyo como un "carrito" (sumando porciones de cada alimento) y al presionar **Evaluar** el backend calcula un puntaje de 0 a 100, da recomendaciones y guarda la evaluación en la base de datos.

- **Backend:** PHP + MySQL (XAMPP)
- **Frontend:** Ionic + Angular, consume la API con Axios

## Estructura

```
proyecto/
├── index.php                   # Redirige /proyecto → /proyecto/app/
├── app/                        # Frontend COMPILADO (lo sirve Apache)
├── api/                        # Backend PHP
│   ├── config.php              # Conexión PDO a MySQL
│   ├── helpers.php             # CORS, respuestas JSON y validación del token
│   ├── login.php               # POST  -> inicia sesión y genera un token
│   ├── foods.php               # GET   -> catálogo de alimentos
│   ├── evaluations.php         # GET   -> historial | POST -> evalúa y guarda
│   └── diet_evaluator.php      # Reglas de nutrición (cálculo del puntaje)
├── sql/
│   └── cuyo_app.sql            # Tablas + usuario demo + catálogo de alimentos
└── ionic-app/src/app/          # Frontend
    ├── login/                  # Pantalla de inicio de sesión
    ├── home/                   # Formulario "carrito" + resultado + historial
    ├── models/diet.model.ts    # Tipos de datos de la API
    ├── services/
    │   ├── http.ts             # Axios: URL base + token en cada petición
    │   ├── auth.service.ts     # Login / logout / sesión
    │   └── diet.service.ts     # Alimentos, evaluar y historial
    └── guards/auth.guard.ts    # Protege /home y /login
```

## Base de datos

| Tabla              | Para qué sirve                                   |
|--------------------|--------------------------------------------------|
| `users`            | Usuarios que pueden iniciar sesión               |
| `user_tokens`      | Tokens de sesión generados en el login (7 días)  |
| `foods`            | Catálogo de alimentos (categoría y vitamina C)   |
| `evaluations`      | Cada evaluación: cuyo, puntaje y nivel           |
| `evaluation_items` | Alimentos y porciones elegidos en cada evaluación|

## Flujo

1. `/login` → `login.php` valida email/contraseña y devuelve un **token**.
2. El token se guarda en `localStorage`; Axios lo envía en cada petición (`Authorization: Bearer <token>`).
3. `/home` (protegida por `authGuard`) pide el catálogo a `foods.php` y lo muestra por secciones.
4. El usuario suma porciones y presiona **Evaluar** → `POST evaluations.php`.
5. El backend valida el token y los datos, aplica las reglas de `diet_evaluator.php`, guarda todo en una **transacción** y devuelve el resultado.
6. Se muestra el puntaje con recomendaciones y se actualiza el historial.

## Reglas de evaluación

Se parte de **100 puntos** y se resta por cada regla que no se cumple:

| Regla                                   | Penalización       |
|-----------------------------------------|--------------------|
| Sin heno (debe ser el 80 % de la dieta) | −35                |
| Sin agua                                | −20                |
| Verduras fuera de 3–6 porciones         | −15 / −10          |
| Vitamina C menor a 10 mg                | −15                |
| Pellets: ninguno / más de 2             | −5 / −10           |
| Más de 2 porciones de fruta             | −10                |
| Cada alimento prohibido                 | −25                |

Nivel: **≥ 85** excelente · **≥ 60** buena · **≥ 35** regular · **< 35** peligro.

## Cómo levantar el proyecto (solo XAMPP)

La app ya viene **compilada** en la carpeta `app/`, así que Apache sirve tanto el frontend como la API. No se necesita Node para usarla.

1. Copia la carpeta `proyecto` dentro de `C:\xampp\htdocs\` (queda `C:\xampp\htdocs\proyecto`).
   La carpeta `ionic-app/node_modules` no hace falta copiarla.
2. En el panel de XAMPP enciende **Apache** y **MySQL**.
3. Importa la base de datos: en phpMyAdmin (`http://localhost/phpmyadmin`) → **Importar** → `sql/cuyo_app.sql`.
4. Abre **http://localhost/proyecto**

**Usuario de prueba:** `demo@correo.com` / `123456`

| URL                                    | Qué es                          |
|----------------------------------------|---------------------------------|
| `http://localhost/proyecto`            | Redirige a la app               |
| `http://localhost/proyecto/app/`       | Frontend compilado (Ionic)      |
| `http://localhost/proyecto/api/...`    | Backend PHP                     |

> La carpeta debe llamarse **`proyecto`**, porque la app compilada busca sus archivos en `/proyecto/app/` y la API en `/proyecto/api`.

## Modificar el frontend (solo si cambias código de `ionic-app`)

Requiere **Node.js 22.22.3+ o 24.15+** (lo exige Angular 22).

```
cd ionic-app
npm install
npm run build      # recompila y reemplaza la carpeta app/
```

Para desarrollar con recarga automática: `npm start -- --port 8100` (abre `http://localhost:8100`; usa la API de XAMPP).

- La ruta de salida y el `baseHref` (`/proyecto/app/`) están en `angular.json` → configuración `production`.
- `src/.htaccess` se copia a `app/` y permite recargar rutas como `/proyecto/app/home` sin error 404.
- URL de la API: `environment.ts` (desarrollo) y `environment.prod.ts` (compilado).

<?php
// =========================================
// Endpoint: GET /api/foods  (foods.php)
// Devuelve el catálogo de alimentos para armar el formulario.
// Requiere header: Authorization: Bearer <token>
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET']);
require_once __DIR__ . '/config.php';

require_auth($pdo);

try {
    $foods = $pdo->query('SELECT id, name, emoji, category, portion_size, vitamin_c_mg FROM foods ORDER BY id')->fetchAll();

    // Las columnas DECIMAL llegan como texto: las convertimos a número
    $foods = array_map(
        fn (array $food) => [...$food, 'vitamin_c_mg' => (float) $food['vitamin_c_mg']],
        $foods
    );

    json_response(200, ['success' => true, 'foods' => $foods]);
} catch (PDOException $e) {
    json_response(500, ['success' => false, 'message' => 'Error del servidor']);
}

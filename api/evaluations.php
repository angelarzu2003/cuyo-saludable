<?php
// =========================================
// Endpoint: /api/evaluations.php
// Requiere header: Authorization: Bearer <token>
//
// GET  -> Historial de evaluaciones del usuario.
// POST -> Evalúa una dieta y la guarda.
//         Body (JSON): { "cuy_name": "Pelusa", "items": [{ "food_id": 1, "quantity": 2 }, ...] }
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET', 'POST']);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/diet_evaluator.php';

$userId = require_auth($pdo);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        list_evaluations($pdo, $userId);
    } else {
        create_evaluation($pdo, $userId);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(500, ['success' => false, 'message' => 'Error del servidor']);
}

/** Devuelve las últimas 10 evaluaciones del usuario. */
function list_evaluations(PDO $pdo, int $userId): never
{
    $stmt = $pdo->prepare(
        'SELECT id, cuy_name, score, level, created_at
         FROM evaluations
         WHERE user_id = :user_id
         ORDER BY created_at DESC, id DESC
         LIMIT 10'
    );
    $stmt->execute(['user_id' => $userId]);

    json_response(200, ['success' => true, 'evaluations' => $stmt->fetchAll()]);
}

/** Valida el formulario, evalúa la dieta y guarda el resultado con sus alimentos. */
function create_evaluation(PDO $pdo, int $userId): never
{
    $data = read_json_body();
    $cuyName = trim($data['cuy_name'] ?? '');
    $items = $data['items'] ?? [];

    // --- Validaciones ---
    if ($cuyName === '' || mb_strlen($cuyName) > 50) {
        json_response(400, ['success' => false, 'message' => 'El nombre del cuyo es obligatorio (máx. 50 caracteres)']);
    }

    if (!is_array($items) || count($items) === 0) {
        json_response(400, ['success' => false, 'message' => 'Selecciona al menos un alimento']);
    }

    // Convertimos la lista en un mapa [food_id => quantity]
    $quantities = [];
    foreach ($items as $item) {
        $foodId = (int) ($item['food_id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);

        if ($foodId <= 0 || $quantity < 1 || $quantity > MAX_PORTIONS_PER_FOOD) {
            json_response(400, ['success' => false, 'message' => 'Alimento o cantidad no válidos']);
        }
        $quantities[$foodId] = $quantity;
    }

    // --- Traer de la BD los alimentos elegidos ---
    $placeholders = implode(',', array_fill(0, count($quantities), '?'));
    $stmt = $pdo->prepare("SELECT id, name, category, vitamin_c_mg FROM foods WHERE id IN ({$placeholders})");
    $stmt->execute(array_keys($quantities));
    $foods = $stmt->fetchAll();

    if (count($foods) !== count($quantities)) {
        json_response(400, ['success' => false, 'message' => 'Algún alimento no existe']);
    }

    // Agregamos a cada alimento la cantidad que eligió el usuario
    foreach ($foods as $i => $food) {
        $foods[$i]['quantity'] = $quantities[$food['id']];
    }

    // --- Evaluar ---
    $result = evaluate_diet($foods);

    // --- Guardar (transacción: se guarda todo o nada) ---
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO evaluations (user_id, cuy_name, score, level) VALUES (:user_id, :cuy_name, :score, :level)'
    );
    $stmt->execute([
        'user_id' => $userId,
        'cuy_name' => $cuyName,
        'score' => $result['score'],
        'level' => $result['level'],
    ]);
    $evaluationId = (int) $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        'INSERT INTO evaluation_items (evaluation_id, food_id, quantity) VALUES (:evaluation_id, :food_id, :quantity)'
    );
    foreach ($quantities as $foodId => $quantity) {
        $stmtItem->execute([
            'evaluation_id' => $evaluationId,
            'food_id' => $foodId,
            'quantity' => $quantity,
        ]);
    }

    $pdo->commit();

    json_response(201, [
        'success' => true,
        'evaluation' => ['id' => $evaluationId, 'cuy_name' => $cuyName, ...$result],
    ]);
}

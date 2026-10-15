<?php
// =========================================
// Endpoint: /api/evaluations  -> Evaluaciones de dieta
// Requiere header: Authorization: Bearer <token>
//
// GET    /api/evaluations                -> Historial del usuario
// GET    /api/cuyos/3/evaluations        -> Historial de un cuyo (= ?cuyo_id=3)
// GET    /api/evaluations/7              -> Detalle: alimentos elegidos + recomendaciones
// POST   /api/evaluations                -> Evalúa una dieta y la guarda
//                       Body: { "cuyo_id": 3, "items": [{ "food_id": 1, "quantity": 2 }, ...] }
// DELETE /api/evaluations/7              -> Elimina una evaluación
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET', 'POST', 'DELETE']);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/diet_evaluator.php';

// Consulta base: evaluaciones con el nombre de su cuyo, solo del usuario dado
const EVALUATION_SELECT = '
    SELECT e.id, e.cuyo_id, c.name AS cuyo_name, e.score, e.level, e.created_at
    FROM evaluations e
    JOIN cuyos c ON c.id = e.cuyo_id
    WHERE c.user_id = :user_id';

$userId = require_auth($pdo);
$id = query_id();

match ($_SERVER['REQUEST_METHOD']) {
    'GET' => $id ? show_evaluation($pdo, $userId, $id) : list_evaluations($pdo, $userId),
    'POST' => create_evaluation($pdo, $userId),
    'DELETE' => delete_evaluation($pdo, $userId, require_query_id()),
};

// --- READ ---

function list_evaluations(PDO $pdo, int $userId): never
{
    $sql = EVALUATION_SELECT;
    $params = ['user_id' => $userId];

    $cuyoId = query_id('cuyo_id');
    if ($cuyoId) {
        $sql .= ' AND e.cuyo_id = :cuyo_id';
        $params['cuyo_id'] = $cuyoId;
    }

    $stmt = $pdo->prepare($sql . ' ORDER BY e.created_at DESC, e.id DESC LIMIT 50');
    $stmt->execute($params);

    json_response(200, ['success' => true, 'evaluations' => $stmt->fetchAll()]);
}

function show_evaluation(PDO $pdo, int $userId, int $id): never
{
    json_response(200, ['success' => true, 'evaluation' => evaluation_detail($pdo, $userId, $id)]);
}

// --- CREATE ---

function create_evaluation(PDO $pdo, int $userId): never
{
    $data = read_json_body();
    $cuyoId = filter_var($data['cuyo_id'] ?? null, FILTER_VALIDATE_INT);
    $items = $data['items'] ?? [];

    // --- Validaciones ---
    if (!$cuyoId || !find_cuyo($pdo, $userId, $cuyoId)) {
        error_response(404, 'El cuyo no existe');
    }
    if (!is_array($items) || count($items) === 0) {
        error_response(400, 'Selecciona al menos un alimento');
    }

    // Convertimos la lista en un mapa [food_id => quantity]
    $quantities = [];
    foreach ($items as $item) {
        $foodId = (int) ($item['food_id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);

        if ($foodId <= 0 || $quantity < 1 || $quantity > MAX_PORTIONS_PER_FOOD) {
            error_response(400, 'Alimento o cantidad no válidos');
        }
        $quantities[$foodId] = $quantity;
    }

    // --- Traer de la BD los alimentos elegidos y agregarles su cantidad ---
    $placeholders = implode(',', array_fill(0, count($quantities), '?'));
    $stmt = $pdo->prepare("SELECT id, name, category, vitamin_c_mg FROM foods WHERE id IN ({$placeholders})");
    $stmt->execute(array_keys($quantities));
    $foods = $stmt->fetchAll();

    if (count($foods) !== count($quantities)) {
        error_response(400, 'Algún alimento no existe');
    }
    foreach ($foods as $i => $food) {
        $foods[$i]['quantity'] = $quantities[$food['id']];
    }

    // --- Evaluar ---
    $result = evaluate_diet($foods);

    // --- Guardar (transacción: se guarda todo o nada) ---
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO evaluations (cuyo_id, score, level) VALUES (:cuyo_id, :score, :level)');
    $stmt->execute(['cuyo_id' => $cuyoId, 'score' => $result['score'], 'level' => $result['level']]);
    $evaluationId = (int) $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        'INSERT INTO evaluation_items (evaluation_id, food_id, quantity) VALUES (:evaluation_id, :food_id, :quantity)'
    );
    foreach ($quantities as $foodId => $quantity) {
        $stmtItem->execute(['evaluation_id' => $evaluationId, 'food_id' => $foodId, 'quantity' => $quantity]);
    }

    $pdo->commit();

    json_response(201, ['success' => true, 'evaluation' => evaluation_detail($pdo, $userId, $evaluationId)]);
}

// --- DELETE ---

function delete_evaluation(PDO $pdo, int $userId, int $id): never
{
    find_evaluation($pdo, $userId, $id) ?? error_response(404, 'La evaluación no existe');

    // Sus alimentos (evaluation_items) se borran solos por ON DELETE CASCADE
    $stmt = $pdo->prepare('DELETE FROM evaluations WHERE id = :id');
    $stmt->execute(['id' => $id]);

    json_response(200, ['success' => true, 'message' => 'Evaluación eliminada']);
}

// --- Auxiliares ---

function find_evaluation(PDO $pdo, int $userId, int $id): ?array
{
    $stmt = $pdo->prepare(EVALUATION_SELECT . ' AND e.id = :id');
    $stmt->execute(['user_id' => $userId, 'id' => $id]);
    return $stmt->fetch() ?: null;
}

/**
 * Evaluación completa: datos + alimentos elegidos + recomendaciones.
 * Las recomendaciones no se guardan: se recalculan a partir de los alimentos.
 */
function evaluation_detail(PDO $pdo, int $userId, int $id): array
{
    $evaluation = find_evaluation($pdo, $userId, $id) ?? error_response(404, 'La evaluación no existe');

    $stmt = $pdo->prepare(
        'SELECT f.name, f.emoji, f.category, f.vitamin_c_mg, i.quantity
         FROM evaluation_items i
         JOIN foods f ON f.id = i.food_id
         WHERE i.evaluation_id = :id
         ORDER BY f.id'
    );
    $stmt->execute(['id' => $id]);
    $items = $stmt->fetchAll();

    return [
        ...$evaluation,
        'feedback' => evaluate_diet($items)['feedback'],
        'items' => array_map(
            fn (array $item) => ['name' => $item['name'], 'emoji' => $item['emoji'], 'quantity' => $item['quantity']],
            $items
        ),
    ];
}

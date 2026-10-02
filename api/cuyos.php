<?php
// =========================================
// Endpoint: /api/cuyos.php  -> CRUD de los cuyos del usuario
// Requiere header: Authorization: Bearer <token>
//
// GET            -> Lista de cuyos (con el puntaje de su última evaluación)
// GET    ?id=5   -> Un cuyo
// POST           -> Crea     Body: { "name", "sex", "age_months", "weight_g" }
// PUT    ?id=5   -> Actualiza (mismo body)
// DELETE ?id=5   -> Elimina el cuyo y sus evaluaciones
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET', 'POST', 'PUT', 'DELETE']);
require_once __DIR__ . '/config.php';

$userId = require_auth($pdo);
$id = query_id();

match ($_SERVER['REQUEST_METHOD']) {
    'GET' => $id ? show_cuyo($pdo, $userId, $id) : list_cuyos($pdo, $userId),
    'POST' => create_cuyo($pdo, $userId),
    'PUT' => update_cuyo($pdo, $userId, require_query_id()),
    'DELETE' => delete_cuyo($pdo, $userId, require_query_id()),
};

// --- READ ---

function list_cuyos(PDO $pdo, int $userId): never
{
    $stmt = $pdo->prepare(CUYO_SELECT . ' WHERE c.user_id = :user_id ORDER BY c.name');
    $stmt->execute(['user_id' => $userId]);

    json_response(200, ['success' => true, 'cuyos' => $stmt->fetchAll()]);
}

function show_cuyo(PDO $pdo, int $userId, int $id): never
{
    json_response(200, ['success' => true, 'cuyo' => require_cuyo($pdo, $userId, $id)]);
}

// --- CREATE ---

function create_cuyo(PDO $pdo, int $userId): never
{
    $cuyo = validate_cuyo(read_json_body());

    $stmt = $pdo->prepare(
        'INSERT INTO cuyos (user_id, name, sex, age_months, weight_g)
         VALUES (:user_id, :name, :sex, :age_months, :weight_g)'
    );
    $stmt->execute(['user_id' => $userId, ...$cuyo]);

    $newId = (int) $pdo->lastInsertId();
    json_response(201, ['success' => true, 'cuyo' => find_cuyo($pdo, $userId, $newId)]);
}

// --- UPDATE ---

function update_cuyo(PDO $pdo, int $userId, int $id): never
{
    require_cuyo($pdo, $userId, $id);
    $cuyo = validate_cuyo(read_json_body());

    $stmt = $pdo->prepare(
        'UPDATE cuyos SET name = :name, sex = :sex, age_months = :age_months, weight_g = :weight_g
         WHERE id = :id'
    );
    $stmt->execute(['id' => $id, ...$cuyo]);

    json_response(200, ['success' => true, 'cuyo' => find_cuyo($pdo, $userId, $id)]);
}

// --- DELETE ---

function delete_cuyo(PDO $pdo, int $userId, int $id): never
{
    require_cuyo($pdo, $userId, $id);

    // Sus evaluaciones se borran solas por la FK con ON DELETE CASCADE
    $stmt = $pdo->prepare('DELETE FROM cuyos WHERE id = :id');
    $stmt->execute(['id' => $id]);

    json_response(200, ['success' => true, 'message' => 'Cuyo eliminado']);
}

// --- Auxiliares ---

/** Devuelve el cuyo o responde 404 si no existe / no es del usuario. */
function require_cuyo(PDO $pdo, int $userId, int $id): array
{
    return find_cuyo($pdo, $userId, $id) ?? error_response(404, 'El cuyo no existe');
}

/** Valida los datos del formulario. Responde 400 con todos los errores encontrados. */
function validate_cuyo(array $data): array
{
    $cuyo = [
        'name' => trim($data['name'] ?? ''),
        'sex' => $data['sex'] ?? '',
        'age_months' => filter_var($data['age_months'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 120]]),
        'weight_g' => filter_var($data['weight_g'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 50, 'max_range' => 3000]]),
    ];

    $errors = [];
    if ($cuyo['name'] === '' || mb_strlen($cuyo['name']) > 50) {
        $errors[] = 'El nombre es obligatorio (máx. 50 caracteres)';
    }
    if (!in_array($cuyo['sex'], ['macho', 'hembra'], true)) {
        $errors[] = 'El sexo debe ser macho o hembra';
    }
    if ($cuyo['age_months'] === false) {
        $errors[] = 'La edad debe estar entre 0 y 120 meses';
    }
    if ($cuyo['weight_g'] === false) {
        $errors[] = 'El peso debe estar entre 50 y 3000 gramos';
    }

    if ($errors) {
        error_response(400, implode('. ', $errors));
    }
    return $cuyo;
}

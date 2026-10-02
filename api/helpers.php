<?php
// =========================================
// Funciones compartidas por todos los endpoints
// =========================================

// Cualquier error no controlado (ej. falla de MySQL) se responde como JSON 500,
// sin mostrar detalles internos al cliente. El detalle queda en el log de PHP.
set_exception_handler(function (Throwable $e): void {
    error_log($e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Error del servidor']);
});

/**
 * Envía las cabeceras CORS/JSON y valida el método HTTP.
 * Las peticiones preflight (OPTIONS) se responden aquí mismo.
 */
function setup_api(array $allowedMethods): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods) . ', OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=UTF-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods, true)) {
        json_response(405, ['success' => false, 'message' => 'Método no permitido']);
    }
}

/** Responde con un código HTTP y un cuerpo JSON, y termina el script. */
function json_response(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Atajo para responder un error: { success: false, message }. */
function error_response(int $status, string $message): never
{
    json_response($status, ['success' => false, 'message' => $message]);
}

/** Lee el cuerpo JSON enviado por Axios como arreglo asociativo. */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        error_response(400, 'El cuerpo de la petición no es un JSON válido');
    }
    return $data;
}

/** Devuelve el parámetro ?id= como entero, o null si no viene. */
function query_id(string $name = 'id'): ?int
{
    $id = filter_input(INPUT_GET, $name, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $id ?: null;
}

/** Igual que query_id(), pero responde 400 si falta. */
function require_query_id(): int
{
    return query_id() ?? error_response(400, 'Falta el parámetro id');
}

/** Extrae el token del header "Authorization: Bearer <token>". */
function bearer_token(): string
{
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    return str_replace('Bearer ', '', $headers['authorization'] ?? '');
}

/**
 * Valida el token contra la tabla user_tokens.
 * Devuelve el id del usuario o responde 401 si el token no es válido o expiró.
 */
function require_auth(PDO $pdo): int
{
    $stmt = $pdo->prepare('SELECT user_id FROM user_tokens WHERE token = :token AND expires_at > NOW() LIMIT 1');
    $stmt->execute(['token' => bearer_token()]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        error_response(401, 'Sesión inválida o expirada');
    }
    return (int) $userId;
}

// Consulta base de cuyos: datos + puntaje y nivel de su evaluación más reciente
const CUYO_SELECT = '
    SELECT c.id, c.name, c.sex, c.age_months, c.weight_g,
           e.score AS last_score, e.level AS last_level
    FROM cuyos c
    LEFT JOIN evaluations e ON e.id = (SELECT MAX(id) FROM evaluations WHERE cuyo_id = c.id)';

/**
 * Busca un cuyo que pertenezca al usuario (con el puntaje de su última evaluación).
 * Devuelve null si no existe o es de otro usuario.
 */
function find_cuyo(PDO $pdo, int $userId, int $cuyoId): ?array
{
    $stmt = $pdo->prepare(CUYO_SELECT . ' WHERE c.user_id = :user_id AND c.id = :id');
    $stmt->execute(['user_id' => $userId, 'id' => $cuyoId]);
    return $stmt->fetch() ?: null;
}

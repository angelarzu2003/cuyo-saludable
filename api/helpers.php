<?php
// =========================================
// Funciones compartidas por todos los endpoints
// =========================================

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

/** Lee el cuerpo JSON enviado por Axios como arreglo asociativo. */
function read_json_body(): array
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

/**
 * Valida el header "Authorization: Bearer <token>" contra la tabla user_tokens.
 * Devuelve el id del usuario o responde 401 si el token no es válido o expiró.
 */
function require_auth(PDO $pdo): int
{
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = str_replace('Bearer ', '', $headers['authorization'] ?? '');

    $stmt = $pdo->prepare('SELECT user_id FROM user_tokens WHERE token = :token AND expires_at > NOW() LIMIT 1');
    $stmt->execute(['token' => $token]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        json_response(401, ['success' => false, 'message' => 'Sesión inválida o expirada']);
    }

    return (int) $userId;
}

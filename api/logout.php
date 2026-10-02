<?php
// =========================================
// Endpoint: POST /api/logout.php
// Elimina el token de sesión para que ya no pueda usarse.
// Requiere header: Authorization: Bearer <token>
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['POST']);
require_once __DIR__ . '/config.php';

$stmt = $pdo->prepare('DELETE FROM user_tokens WHERE token = :token');
$stmt->execute(['token' => bearer_token()]);

json_response(200, ['success' => true, 'message' => 'Sesión cerrada']);

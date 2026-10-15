<?php
// =========================================
// Endpoint: GET /api/health  -> Estado del servicio web
// No requiere token. La app lo usa para probar la URL del servidor (Perfil -> Servidor).
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET']);
require_once __DIR__ . '/config.php'; // si MySQL no responde, config.php ya contesta 500

$pdo->query('SELECT 1');

json_response(200, [
    'success' => true,
    'service' => 'Cuyo Saludable API',
    'version' => API_VERSION,
    'database' => 'ok',
    'server_time' => date('c'),
]);

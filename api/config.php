<?php
// =========================================
// Configuración de conexión a la BD
// =========================================

$DB_HOST = 'localhost';
$DB_NAME = 'cuyo_app';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    json_response(500, ['success' => false, 'message' => 'Error de conexión a la base de datos']);
}

<?php
// =========================================
// Endpoint: POST /api/login.php
// Body (JSON): { "email": "demo@correo.com", "password": "123456" }
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['POST']);
require_once __DIR__ . '/config.php';

// --- Leer y validar datos ---
$data = read_json_body();
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(400, ['success' => false, 'message' => 'Email y password son obligatorios']);
}

try {
    // --- Buscar usuario ---
    $stmt = $pdo->prepare('SELECT id, name, email, password, status FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // Mismo mensaje si no existe o si la contraseña falla (no revelamos cuál de los dos)
    if (!$user || !password_verify($password, $user['password'])) {
        json_response(401, ['success' => false, 'message' => 'Credenciales inválidas']);
    }

    if ((int) $user['status'] !== 1) {
        json_response(403, ['success' => false, 'message' => 'Usuario inactivo']);
    }

    // --- Generar token de sesión (válido 7 días) ---
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

    $stmtToken = $pdo->prepare(
        'INSERT INTO user_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)'
    );
    $stmtToken->execute([
        'user_id' => $user['id'],
        'token' => $token,
        'expires_at' => $expiresAt,
    ]);

    json_response(200, [
        'success' => true,
        'message' => 'Login exitoso',
        'token' => $token,
        'expires_at' => $expiresAt,
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
        ],
    ]);
} catch (PDOException $e) {
    json_response(500, ['success' => false, 'message' => 'Error del servidor']);
}

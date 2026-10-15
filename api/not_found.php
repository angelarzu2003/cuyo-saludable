<?php
// =========================================
// Respuesta para rutas que no existen en la API (ver .htaccess)
// =========================================

require_once __DIR__ . '/helpers.php';
setup_api(['GET', 'POST', 'PUT', 'DELETE']);

error_response(404, 'Ruta no encontrada');

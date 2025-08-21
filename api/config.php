<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir configuración de la base de datos
require_once '../config/database.php';

// Función para obtener el cuerpo de la solicitud JSON
function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// Función para enviar respuesta JSON
function sendResponse($success, $data = null, $message = '') {
    $response = ['success' => $success];
    if ($data !== null) $response['data'] = $data;
    if ($message) $response['message'] = $message;
    echo json_encode($response);
    exit;
}

// Conectar a la base de datos
try {
    $pdo = getDBConnection();
} catch (PDOException $e) {
    http_response_code(500);
    sendResponse(false, null, 'Error de conexión: ' . $e->getMessage());
}
?>
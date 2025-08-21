<?php
require_once 'config.php';

// Solo permitimos GET para clientes
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Método no permitido');
}

// Obtener todos los clientes
$stmt = $pdo->query('SELECT * FROM clientes ORDER BY name');
$clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
sendResponse(true, $clients);
?>
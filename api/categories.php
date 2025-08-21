<?php
require_once 'config.php';

// Solo permitimos GET para categorías
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Método no permitido');
}

// Obtener todas las categorías
$stmt = $pdo->query('SELECT * FROM categorias ORDER BY tipo, nombre');
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
sendResponse(true, $categories);
?>
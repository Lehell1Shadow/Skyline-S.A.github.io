<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener todas las semanas o una específica por ID
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('SELECT * FROM semanas WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $week = $stmt->fetch(PDO::FETCH_ASSOC);
            sendResponse(true, $week);
        } else {
            $stmt = $pdo->query('SELECT * FROM semanas ORDER BY start_date DESC');
            $weeks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(true, $weeks);
        }
        break;
        
    case 'POST':
        // Crear una nueva semana
        $data = getRequestData();
        
        $stmt = $pdo->prepare('INSERT INTO semanas (start_date, budget) VALUES (?, ?)');
        $success = $stmt->execute([
            $data['start_date'],
            $data['budget']
        ]);
        
        if ($success) {
            sendResponse(true, ['id' => $pdo->lastInsertId()], 'Semana creada correctamente');
        } else {
            sendResponse(false, null, 'Error al crear la semana');
        }
        break;
        
    default:
        sendResponse(false, null, 'Método no permitido');
        break;
}
?>
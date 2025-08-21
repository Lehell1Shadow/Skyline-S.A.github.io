<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener todas las transacciones o una específica por ID
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('SELECT * FROM transacciones WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
            sendResponse(true, $transaction);
        } else {
            $stmt = $pdo->query('SELECT * FROM transacciones ORDER BY fecha DESC');
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(true, $transactions);
        }
        break;
        
    case 'POST':
        // Crear una nueva transacción
        $data = getRequestData();
        
        $stmt = $pdo->prepare('INSERT INTO transacciones (fecha, descripcion, tipo, categoria_id, monto, semana_id) VALUES (?, ?, ?, ?, ?, ?)');
        $success = $stmt->execute([
            $data['date'],
            $data['description'],
            $data['type'],
            $data['category_id'],
            $data['amount'],
            $data['week_id']
        ]);
        
        if ($success) {
            sendResponse(true, ['id' => $pdo->lastInsertId()], 'Transacción creada correctamente');
        } else {
            sendResponse(false, null, 'Error al crear la transacción');
        }
        break;
        
    case 'DELETE':
        // Eliminar una transacción
        if (!isset($_GET['id'])) {
            sendResponse(false, null, 'ID de transacción no proporcionado');
        }
        
        $stmt = $pdo->prepare('DELETE FROM transacciones WHERE id = ?');
        $success = $stmt->execute([$_GET['id']]);
        
        if ($success) {
            sendResponse(true, null, 'Transacción eliminada correctamente');
        } else {
            sendResponse(false, null, 'Error al eliminar la transacción');
        }
        break;
        
    default:
        sendResponse(false, null, 'Método no permitido');
        break;
}
?>
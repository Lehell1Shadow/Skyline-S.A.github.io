<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener todos los contratos o uno específico por ID
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('
                SELECT c.*, cl.name as client_name, cl.cellphone as client_cellphone 
                FROM contratos c 
                INNER JOIN clientes cl ON c.cliente_id = cl.id 
                WHERE c.id = ?
            ');
            $stmt->execute([$_GET['id']]);
            $contract = $stmt->fetch(PDO::FETCH_ASSOC);
            sendResponse(true, $contract);
        } else {
            $stmt = $pdo->query('
                SELECT c.*, cl.name as client_name, cl.cellphone as client_cellphone 
                FROM contratos c 
                INNER JOIN clientes cl ON c.cliente_id = cl.id 
                ORDER BY c.created_at DESC
            ');
            $contracts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(true, $contracts);
        }
        break;
        
    case 'POST':
        // Crear un nuevo contrato (y cliente/aval si es necesario)
        $data = getRequestData();
        
        try {
            $pdo->beginTransaction();
            
            // 1. Insertar cliente
            $stmt = $pdo->prepare('
                INSERT INTO clientes (name, fecha_nacimiento, clave_elector, direccion, colonia, codigo_postal, 
                municipio, estado, telefono_casa, telefono_celular, telefono_recados, email, asignacion, 
                promotor, supervisor, ejecutivo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            
            $clientData = $data['client'];
            $stmt->execute([
                $clientData['name'],
                $clientData['birthdate'],
                $clientData['voter_id'],
                $clientData['address'],
                $clientData['neighborhood'],
                $clientData['zip'],
                $clientData['municipality'],
                $clientData['state'],
                $clientData['phone'],
                $clientData['cellphone'],
                $clientData['message_phone'],
                $clientData['email'],
                $clientData['assignment'],
                $clientData['promoter'],
                $clientData['supervisor'],
                $clientData['executive']
            ]);
            
            $clientId = $pdo->lastInsertId();
            
            // 2. Insertar aval
            $stmt = $pdo->prepare('
                INSERT INTO avales (name, fecha_nacimiento, clave_elector, direccion, colonia, codigo_postal, 
                municipio, estado, telefono_casa, telefono_celular, telefono_recados, email, grupo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            
            $avalData = $data['aval'];
            $stmt->execute([
                $avalData['name'],
                $avalData['birthdate'],
                $avalData['voter_id'],
                $avalData['address'],
                $avalData['neighborhood'],
                $avalData['zip'],
                $avalData['municipality'],
                $avalData['state'],
                $avalData['phone'],
                $avalData['cellphone'],
                $avalData['message_phone'],
                $avalData['email'],
                $avalData['group']
            ]);
            
            $avalId = $pdo->lastInsertId();
            
            // 3. Insertar contrato
            $folio = 'CTR-' . strtoupper(uniqid());
            
            $stmt = $pdo->prepare('
                INSERT INTO contratos (folio, cliente_id, aval_id, monto, tasa_interes, plazo_semanas, 
                pago_semanal, fecha_inicio, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            
            $stmt->execute([
                $folio,
                $clientId,
                $avalId,
                $data['amount'],
                $data['interest'],
                $data['term'],
                $data['weekly_payment'],
                $data['start_date'],
                $data['status']
            ]);
            
            $contractId = $pdo->lastInsertId();
            
            $pdo->commit();
            
            sendResponse(true, ['id' => $contractId, 'folio' => $folio], 'Contrato creado correctamente');
            
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(false, null, 'Error al crear el contrato: ' . $e->getMessage());
        }
        break;
        
    case 'DELETE':
        // Eliminar un contrato
        if (!isset($_GET['id'])) {
            sendResponse(false, null, 'ID de contrato no proporcionado');
        }
        
        try {
            $pdo->beginTransaction();
            
            // Primero obtenemos los IDs del cliente y aval
            $stmt = $pdo->prepare('SELECT cliente_id, aval_id FROM contratos WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $contract = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$contract) {
                throw new Exception('Contrato no encontrado');
            }
            
            // Eliminamos el contrato
            $stmt = $pdo->prepare('DELETE FROM contratos WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            
            // Verificamos si el cliente tiene otros contratos
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM contratos WHERE cliente_id = ?');
            $stmt->execute([$contract['cliente_id']]);
            $clientCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Si no tiene más contratos, eliminamos el cliente
            if ($clientCount == 0) {
                $stmt = $pdo->prepare('DELETE FROM clientes WHERE id = ?');
                $stmt->execute([$contract['cliente_id']]);
            }
            
            // Verificamos si el aval tiene otros contratos
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM contratos WHERE aval_id = ?');
            $stmt->execute([$contract['aval_id']]);
            $avalCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Si no tiene más contratos, eliminamos el aval
            if ($avalCount == 0) {
                $stmt = $pdo->prepare('DELETE FROM avales WHERE id = ?');
                $stmt->execute([$contract['aval_id']]);
            }
            
            $pdo->commit();
            sendResponse(true, null, 'Contrato eliminado correctamente');
            
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(false, null, 'Error al eliminar el contrato: ' . $e->getMessage());
        }
        break;
        
    default:
        sendResponse(false, null, 'Método no permitido');
        break;
}
?>
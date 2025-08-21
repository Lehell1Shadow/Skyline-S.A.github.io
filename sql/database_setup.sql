-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_financiero;
USE sistema_financiero;

-- Tabla de semanas financieras
CREATE TABLE semanas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    start_date DATE NOT NULL,
    budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de transacciones
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('income', 'expense') NOT NULL
);

-- Insertar categorías predeterminadas
INSERT INTO categorias (nombre, tipo) VALUES
('Salario', 'income'),
('Freelance', 'income'),
('Inversiones', 'income'),
('Regalos', 'income'),
('Alimentación', 'expense'),
('Transporte', 'expense'),
('Vivienda', 'expense'),
('Entretenimiento', 'expense'),
('Salud', 'expense'),
('Educación', 'expense');

-- Tabla de transacciones
CREATE TABLE transacciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    tipo ENUM('income', 'expense') NOT NULL,
    categoria_id INT NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    semana_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (semana_id) REFERENCES semanas(id)
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    clave_elector VARCHAR(50) NOT NULL UNIQUE,
    direccion TEXT NOT NULL,
    colonia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    telefono_casa VARCHAR(20),
    telefono_celular VARCHAR(20) NOT NULL,
    telefono_recados VARCHAR(20),
    email VARCHAR(100),
    asignacion VARCHAR(100),
    promotor VARCHAR(100) NOT NULL,
    supervisor VARCHAR(100) NOT NULL,
    ejecutivo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de avales
CREATE TABLE avales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    clave_elector VARCHAR(50) NOT NULL UNIQUE,
    direccion TEXT NOT NULL,
    colonia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    telefono_casa VARCHAR(20),
    telefono_celular VARCHAR(20) NOT NULL,
    telefono_recados VARCHAR(20),
    email VARCHAR(100),
    grupo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de contratos
CREATE TABLE contratos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    folio VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    aval_id INT NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    tasa_interes DECIMAL(5, 2) NOT NULL,
    plazo_semanas INT NOT NULL,
    pago_semanal DECIMAL(15, 2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    estado ENUM('pendiente', 'activo', 'completado', 'cancelado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (aval_id) REFERENCES avales(id)
);
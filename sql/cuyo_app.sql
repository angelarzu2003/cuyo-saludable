-- =========================================
-- Base de datos: Cuyo Saludable
-- Coincide con api/config.php ($DB_NAME = 'cuyo_app')
-- =========================================

CREATE DATABASE IF NOT EXISTS `cuyo_app`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `cuyo_app`;

-- --------------------------------------------
-- Tabla: users (usuarios que pueden iniciar sesión)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'Hash generado con password_hash()',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = inactivo',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Tabla: user_tokens (sesiones generadas en el login)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` CHAR(64) NOT NULL COMMENT 'bin2hex(random_bytes(32))',
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_tokens_token` (`token`),
  KEY `idx_user_tokens_user_id` (`user_id`),
  CONSTRAINT `fk_user_tokens_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Tabla: foods (catálogo de alimentos que se muestran en el formulario)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `foods` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `emoji` VARCHAR(8) NOT NULL,
  `category` ENUM('heno', 'agua', 'verdura', 'pellet', 'fruta', 'prohibido') NOT NULL,
  `portion_size` VARCHAR(60) NOT NULL COMMENT 'Cuánto equivale a 1 porción',
  `vitamin_c_mg` DECIMAL(4,1) NOT NULL DEFAULT 0 COMMENT 'Vitamina C por porción',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Tabla: evaluations (cada vez que un usuario evalúa una dieta)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `cuy_name` VARCHAR(50) NOT NULL,
  `score` TINYINT UNSIGNED NOT NULL COMMENT 'Puntaje de 0 a 100',
  `level` VARCHAR(20) NOT NULL COMMENT 'excelente | buena | regular | peligro',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evaluations_user_id` (`user_id`),
  CONSTRAINT `fk_evaluations_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Tabla: evaluation_items (alimentos elegidos en cada evaluación, el "carrito")
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `evaluation_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `evaluation_id` INT UNSIGNED NOT NULL,
  `food_id` INT UNSIGNED NOT NULL,
  `quantity` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_items_evaluation`
    FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_items_food`
    FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Usuario de prueba
-- email: demo@correo.com
-- password: 123456
-- --------------------------------------------
INSERT INTO `users` (`name`, `email`, `password`, `status`) VALUES
('Usuario Demo', 'demo@correo.com', '$2y$10$MAbNfjwXvmmT37JmZGngeuf8fBemu3Hqk92rlpnrgJ.onRgZkPDPW', 1)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);

-- --------------------------------------------
-- Catálogo de alimentos (valores aproximados para un cuyo adulto)
-- --------------------------------------------
INSERT IGNORE INTO `foods` (`id`, `name`, `emoji`, `category`, `portion_size`, `vitamin_c_mg`) VALUES
-- Básicos: deben estar siempre disponibles
(1,  'Heno',            '🌾', 'heno',      '1 puñado grande',        0),
(2,  'Agua fresca',     '💧', 'agua',      '1 bebedero lleno',       0),
-- Verduras: la principal fuente de vitamina C
(3,  'Pimiento',        '🫑', 'verdura',   '1 tira (20 g)',          25),
(4,  'Perejil',         '🌿', 'verdura',   '1 ramito (10 g)',        13),
(5,  'Brócoli',         '🥦', 'verdura',   '1 arbolito (15 g)',      13),
(6,  'Cilantro',        '🌱', 'verdura',   '1 ramito (10 g)',        3),
(7,  'Lechuga romana',  '🥬', 'verdura',   '2 hojas (30 g)',         1),
(8,  'Zanahoria',       '🥕', 'verdura',   '1 rodaja (15 g)',        1),
(9,  'Pepino',          '🥒', 'verdura',   '2 rodajas (20 g)',       1),
-- Pellets: complemento enriquecido
(10, 'Pellets',         '🥣', 'pellet',    '1 cucharada (15 g)',     5),
-- Frutas: solo como premio, tienen mucha azúcar
(11, 'Kiwi',            '🥝', 'fruta',     '1 rodaja (15 g)',        14),
(12, 'Fresa',           '🍓', 'fruta',     '1 fresa (12 g)',         7),
(13, 'Manzana',         '🍎', 'fruta',     '1 gajo sin semillas',    1),
(14, 'Plátano',         '🍌', 'fruta',     '1 rodaja (10 g)',        1),
-- Prohibidos: tóxicos o dañinos para el cuyo
(15, 'Chocolate',       '🍫', 'prohibido', '1 trocito',              0),
(16, 'Cebolla',         '🧅', 'prohibido', '1 trocito',              0),
(17, 'Papa',            '🥔', 'prohibido', '1 trocito',              0),
(18, 'Aguacate',        '🥑', 'prohibido', '1 trocito',              0),
(19, 'Pan o galletas',  '🍞', 'prohibido', '1 trocito',              0),
(20, 'Queso',           '🧀', 'prohibido', '1 trocito',              0);

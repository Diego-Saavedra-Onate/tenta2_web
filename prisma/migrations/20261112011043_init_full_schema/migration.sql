-- CreateTable
CREATE TABLE `Usuario` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(250) NOT NULL,
    `password` VARCHAR(250) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `rol` VARCHAR(50) NOT NULL,
    `telefono` VARCHAR(15) NOT NULL,
    `vetado` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categorias` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Productos` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,
    `precio` DECIMAL(10, 0) NOT NULL,
    `disponibilidad` TINYINT UNSIGNED NOT NULL,
    `producto_visible` BOOLEAN NOT NULL DEFAULT true,
    `imagen` VARCHAR(255) NOT NULL,
    `categoria_id` SMALLINT NOT NULL,

    INDEX `Productos_categoria_id_idx`(`categoria_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `usuario_id` SMALLINT NOT NULL,
    `estado` ENUM('PEN', 'ACE', 'PRE', 'LIS', 'ENT', 'RCH') NOT NULL DEFAULT 'PEN',
    `fecha_retiro` DATE NOT NULL,
    `nombre_cliente` VARCHAR(100) NOT NULL,
    `rut_cliente` VARCHAR(12) NOT NULL,
    `monto_total` DECIMAL(10, 0) NOT NULL,
    `fecha_pedido` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_retiro_efectiva` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalle_pedido` (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `pedido_id` MEDIUMINT NOT NULL,
    `producto_id` SMALLINT NOT NULL,
    `cantidad` TINYINT UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(10, 0) NOT NULL,
    `personalizacion` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `pedido_id` MEDIUMINT NOT NULL,
    `comprobante` VARCHAR(255) NOT NULL,
    `monto` DECIMAL(10, 0) NOT NULL,
    `estado` ENUM('PEN', 'CON', 'RCH') NOT NULL DEFAULT 'PEN',
    `fecha_comprobante` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Productos` ADD CONSTRAINT `Productos_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `Categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_pedido` ADD CONSTRAINT `detalle_pedido_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE DATABASE IF NOT EXISTS `ingestion_schema`;

CREATE TABLE IF NOT EXISTS `ingestion_schema`.`file_sync_info` (
    `organization_id` BIGINT,
    `sync_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` TEXT,
    `path` TEXT,
    `sync_type` TINYTEXT,
    `sync_status` TINYTEXT,
    `start_time` BIGINT default 0,
    `end_time` BIGINT default 0,
    `total_files` INT default 0,
    `num_failed` INT default 0
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ingestion_schema`.`file_sync_history` (
    `organization_id` BIGINT,
    `history_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sync_id` BIGINT,
    `file_name` TEXT,
    `start_time` BIGINT default 0,
    `end_time` BIGINT default 0,
    `sync_status` TINYTEXT,
    `message` LONGTEXT
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ingestion_schema`.`share_info`(
    `id` varchar(255) NOT NULL,
    `organization_id` bigint(20) NOT NULL,
    `resource_type` varchar(255) NOT NULL,
    `resource_id` varchar(255) NOT NULL,
    `username` varchar(255) NOT NULL,
    `created_at` bigint(20) DEFAULT NULL,
    `updated_at` bigint(20) DEFAULT NULL,
    `created_by` varchar(255) DEFAULT NULL,
    `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
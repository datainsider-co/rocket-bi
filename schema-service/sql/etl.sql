CREATE DATABASE IF NOT EXISTS `etl`;

CREATE TABLE IF NOT EXISTS `etl`.`job` (
    `organization_id` BIGINT,
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `display_name` TEXT,
    `operators` LONGTEXT,
    `schedule_time` TEXT,
    `owner_id` TEXT,
    `created_time` BIGINT,
    `updated_time` BIGINT,
    `next_execute_time` BIGINT,
    `last_execute_time` BIGINT,
    `job_status` TEXT,
    `last_history_id` BIGINT default null,
    `extra_data` LONGTEXT,
    `operator_info` LONGTEXT,
    `config` LONGTEXT
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `etl`.`deleted_job` (
    `organization_id` BIGINT,
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `display_name` TEXT,
    `operators` LONGTEXT,
    `schedule_time` TEXT,
    `owner_id` TEXT,
    `created_time` BIGINT,
    `updated_time` BIGINT,
    `next_execute_time` BIGINT,
    `last_execute_time` BIGINT,
    `job_status` TEXT,
    `deleted_time` BIGINT,
    `last_history_id` BIGINT default null,
    `extra_data` LONGTEXT,
    `operator_info` LONGTEXT,
    `config` LONGTEXT
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `etl`.`job_history` (
    `organization_id` BIGINT not null,
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `etl_job_id` BIGINT not null,
    `total_execution_time` BIGINT not null,
    `status` TEXT not null,
    `owner_id` TEXT not null,
    `created_time` BIGINT,
    `updated_time` BIGINT,
    `message` LONGTEXT,
    `operator_error` LONGTEXT default null,
    `table_schemas` LONGTEXT default null
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `etl`.`share_info`(
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

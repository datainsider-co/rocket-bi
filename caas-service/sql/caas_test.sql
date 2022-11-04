CREATE DATABASE IF NOT EXISTS `caas_test`;

USE `caas_test`;

--- NOTE ---;
--- + Run this script to setup schema and default data for user profile service;
--- + Comment in this file follows this rule: begin with `---` and end with a semi-comma like this one;
--- please follow this rule because this script might be parsed and run by scala code;


--- SETUP NEEDED TABLE SCHEMA ---;

CREATE TABLE IF NOT EXISTS `user`
(
    `organization_id` bigint(20) NOT NULL,
    `username`     varchar(255) NOT NULL,
    `password`     varchar(255) NOT NULL,
    `is_active`    tinyint(1) NOT NULL DEFAULT '1',
    `created_time` bigint(20) NOT NULL DEFAULT '0',
    `user_type` varchar(255) NOT NULL DEFAULT 'user',
    PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `organization`
(
    `licence_key` varchar(255) DEFAULT NULL,
    `organization_id` bigint(20) NOT NULL,
    `owner`           varchar(255) NOT NULL,
    `name`            varchar(255) NOT NULL,
    `domain`          varchar(255) NOT NULL DEFAULT '',
    `is_active`       tinyint(1) NOT NULL DEFAULT '1',
    `report_time_zone_id`   varchar(255) DEFAULT 'Asia/Saigon',
    `thumbnail_url`   varchar(255) DEFAULT NULL,
    `created_time`    bigint(20) DEFAULT NULL,
    `updated_time`    bigint(20) DEFAULT NULL,
    `updated_by`    varchar(255) DEFAULT NULL,
    PRIMARY KEY (`organization_id`),
    KEY               `FK_organization_0` (`owner`),
    CONSTRAINT `FK_organization_0` FOREIGN KEY (`owner`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `organization_members`
(
    `organization_id` bigint(20) NOT NULL,
    `username`        varchar(255) NOT NULL,
    `added_by`        varchar(255) NOT NULL,
    `added_time`      bigint(20) DEFAULT '0',
    CONSTRAINT `added_by` FOREIGN KEY (`added_by`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organization` (`organization_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `username` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `role`
(
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `role_name`       varchar(255) NOT NULL,
    PRIMARY KEY (`organization_id`, `role_id`, `role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `role_permissions`
(
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `permission`      varchar(255) NOT NULL,
    PRIMARY KEY (`organization_id`, `role_id`, `permission`),
    KEY               `role_id_fk_idx` (`role_id`),
    CONSTRAINT `role_id_fk` FOREIGN KEY (`organization_id`, `role_id`) REFERENCES `role` (`organization_id`, `role_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `user_permissions`
(
    `organization_id` bigint(20) NOT NULL,
    `username`        varchar(255) NOT NULL,
    `permission`      varchar(255) NOT NULL,
    PRIMARY KEY (`username`, `permission`, `organization_id`),
    KEY               `FK_user_permissions_0` (`username`),
    CONSTRAINT `FK_user_permissions_0` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `user_roles`
(
    `username`        varchar(255) NOT NULL,
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `expired_time`    bigint(20) DEFAULT '9223372036854775807',
    PRIMARY KEY (`username`, `organization_id`, `role_id`),
    KEY               `FK_user_roles_1` (`username`),
    CONSTRAINT `FK_user_roles_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `user_profile`(
    `organization_id` bigint(20) NOT NULL,
    `username` VARCHAR(255) NOT NULL PRIMARY KEY,
    `full_name` VARCHAR(255),
    `last_name` VARCHAR(255),
    `first_name` VARCHAR(255),
    `email` VARCHAR(255) NOT NULL,
    `mobile_phone` VARCHAR(30),
    `gender` INT,
    `dob` BIGINT(20),
    `avatar` VARCHAR(255),
    `already_confirmed` TINYINT(1) DEFAULT TRUE,
    `properties` LONGTEXT,
    `updated_time` BIGINT(20),
    `created_time` BIGINT(20),
    KEY `FK_username`(username),
    CONSTRAINT `FK_username` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `unique_email` UNIQUE (`organization_id`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `login_method_provider`
(
    `oauth_type`   varchar(255) not null,
    `organization_id` bigint(20) not null,
    `oauth_config` longtext     not null,
    CONSTRAINT `oauth_type` UNIQUE (oauth_type)
);

CREATE TABLE IF NOT EXISTS `api_key`
(
    `organization_id` bigint(20) NOT NULL,
    `api_key`     varchar(255) NOT NULL,
    `display_name`     varchar(255) NOT NULL,
    `expired_time`    bigint(20) NOT NULL DEFAULT '5184000000',
    `created_at` bigint(20) NOT NULL,
    `updated_at` bigint(20) NOT NULL,
    `created_by` varchar(255),
    `updated_by` varchar(255),
    PRIMARY KEY (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--- SETUP DEFAULT ORGANIZATION ---;

--- create root user of single tenant organization;
--- password reminder: first ever password used for hello account;
INSERT IGNORE INTO `user` (organization_id, username, password, is_active, created_time)
VALUES(0, 'root', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 1, unix_timestamp(now()) * 1000);

--- create single tenant organization;
INSERT IGNORE INTO `organization` (organization_id, name, owner, domain, is_active, report_time_zone_id, thumbnail_url, created_time, updated_time, updated_by, licence_key)
VALUES (0, 'Data Insider', 'root', '', 1, 'Asia/Saigon', NULL, unix_timestamp(now()) * 1000, unix_timestamp(now()) * 1000, 'root', UUID());

--- add root user permission;
INSERT IGNORE INTO `user_permissions` (organization_id, username, permission)
VALUES(0, 'root', '0:*:*:*');

--- add root user profile;
INSERT IGNORE INTO `user_profile`(organization_id, username, full_name, email, created_time, updated_time)
VALUES(0, 'root', 'root', 'hello@gmail.com', unix_timestamp(now()) * 1000, unix_timestamp(now()) * 1000);

--- insert supported login methods;
INSERT IGNORE INTO `login_method_provider` (oauth_type, organization_id, oauth_config)
VALUES  ('gg', 0, '{"is_active":true,"whitelist_email":[],"client_ids":["147123631762-p2149desosmqr59un7mbjm2p65k566gh.apps.googleusercontent.com"],"organization_id":0,"oauth_type":"gg","name":"Google"}');

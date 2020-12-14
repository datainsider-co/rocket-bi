CREATE DATABASE  IF NOT EXISTS `caas_dev`;

USE `caas_dev`;

CREATE TABLE IF NOT EXISTS `user`
(
    `username`     varchar(255) NOT NULL,
    `password`     varchar(255) NOT NULL,
    `is_active`    tinyint(1) NOT NULL DEFAULT '1',
    `created_time` bigint(20) NOT NULL DEFAULT '0',
    PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `organization`
(
    `organization_id` bigint(20) NOT NULL,
    `owner`           varchar(255) NOT NULL,
    `name`            varchar(255) NOT NULL,
    `thumbnail_url`   varchar(255) DEFAULT NULL,
    `created_time`    bigint(20) NOT NULL DEFAULT '0',
    PRIMARY KEY (`organization_id`),
    KEY               `FK_organization_0` (`owner`),
    CONSTRAINT `FK_organization_0` FOREIGN KEY (`owner`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `organization_members`
(
    `organization_id` bigint(20) NOT NULL,
    `username`        varchar(255) NOT NULL,
    `added_by`        varchar(255) NOT NULL,
    `added_time`      bigint(20) DEFAULT '0',
    PRIMARY KEY (`organization_id`),
    KEY               `username` (`username`),
    KEY               `added_by` (`added_by`),
    CONSTRAINT `added_by` FOREIGN KEY (`added_by`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `organization_id` FOREIGN KEY (`organization_id`) REFERENCES `organization` (`organization_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `username` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `role`
(
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `role_name`       varchar(255) NOT NULL,
    PRIMARY KEY (`organization_id`, `role_id`, `role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `role_permissions`
(
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `permission`      varchar(255) NOT NULL,
    PRIMARY KEY (`organization_id`, `role_id`, `permission`),
    KEY               `role_id_fk_idx` (`role_id`),
    CONSTRAINT `role_id_fk` FOREIGN KEY (`organization_id`, `role_id`) REFERENCES `role` (`organization_id`, `role_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE IF NOT EXISTS `user_permissions`
(
    `organization_id` bigint(20) NOT NULL,
    `username`        varchar(255) NOT NULL,
    `permission`      varchar(255) NOT NULL,
    PRIMARY KEY (`username`, `permission`, `organization_id`),
    KEY               `FK_user_permissions_0` (`username`),
    CONSTRAINT `FK_user_permissions_0` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `user_roles`
(
    `username`        varchar(255) NOT NULL,
    `organization_id` bigint(20) NOT NULL,
    `role_id`         int(11) NOT NULL,
    `expired_time`    bigint(20) DEFAULT '9223372036854775807',
    PRIMARY KEY (`username`, `organization_id`, `role_id`),
    KEY               `FK_user_roles_1` (`username`),
    CONSTRAINT `FK_user_roles_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELETE FROM `user` WHERE username = 'datainsider';

DELETE FROM `organization` WHERE organization_id = 0;

DELETE FROM `organization` WHERE organization_id = 1;

INSERT INTO `user` (username,password,is_active,created_time) VALUES('datainsider','MYmHiVG5nWcrxqx8S3KilcwJaqCXqqqIq3/J86wV/64=',1,1597653313139);

INSERT INTO `organization` (organization_id, owner, name, thumbnail_url, created_time) VALUES (0, 'datainsider', 'None', NULL, 0), (1, 'datainsider', 'Data Insider', NULL, 0);
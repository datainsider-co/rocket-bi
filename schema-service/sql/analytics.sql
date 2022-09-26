CREATE DATABASE  IF NOT EXISTS `bi_service_schema`;

CREATE TABLE IF NOT EXISTS `bi_service_schema`.`job_infos` (
   `job_id` varchar(255) NOT NULL,
   `organization_id` bigint(20) NOT NULL,
   `report_type` varchar(255) NOT NULL,
   `name` varchar(255) NOT NULL,
   `description` varchar(100) DEFAULT '',
   `report_time` bigint(20) NOT NULL,
   `created_time` bigint(20) NOT NULL DEFAULT '0',
   `started_time` bigint(20) DEFAULT '0',
   `duration` int(11) DEFAULT '0',
   `run_count` int(11) DEFAULT '0',
   `params` longtext,
   `job_status` varchar(255) NOT NULL,
   PRIMARY KEY (`job_id`,`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
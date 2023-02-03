package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future

import scala.collection.mutable

trait SchemaManager {

  /** *
    * This function ensures that database and all needed table must already setup
    *
    * @return
    */
  def ensureDatabase(): Future[Boolean]

}

/** *
  * Ensure database is well setup.
  *
  * Check @databaseName exists in MySqlDatabase (jdbcClient).
  * Create if @databaseName not exist.
  *
  * @param client           mysql client to connect to mysql server
  * @param dbName           name of database to manage directory & dashboard
  */
class MySqlSchemaManager @Inject() (
    @Named("mysql") client: JdbcClient,
    dbName: String
) extends SchemaManager {

  /** *
    * This function ensures that database and all needed table must already setup
    *
    * @return
    */
  override def ensureDatabase(): Future[Boolean] = {

    val tblDirectoryName: String = ZConfig.getString("database_schema.table.directory.name")
    val tblDashboardName: String = ZConfig.getString("database_schema.table.dashboard.name")
    val tblPermissionTokenName: String = ZConfig.getString("database_schema.table.permission_token.name")
    val tblObjectSharingTokenName: String = ZConfig.getString("database_schema.table.object_sharing_token.name")
    val tblGeolocation: String = ZConfig.getString("database_schema.table.geolocation.name")
    val tblShareInfoName: String = ZConfig.getString("database_schema.table.share_info.name")
    val tblDeletedDirsName: String = ZConfig.getString("database_schema.table.deleted_directory.name")
    val tblRecentDirsName: String = ZConfig.getString("database_schema.table.recent_directory.name")
    val tblStarredDirsName: String = ZConfig.getString("database_schema.table.starred_directory.name")
    val tblDashboardField: String = ZConfig.getString("database_schema.table.dashboard_field.name")
    val tblRlsPolicy: String = ZConfig.getString("database_schema.table.rls_policy.name")

    val dashboardFields: Set[String] = ZConfig.getStringList("database_schema.table.dashboard.fields").toSet
    val directoryFields: Set[String] = ZConfig.getStringList("database_schema.table.directory.fields").toSet
    val permissionTokenFields: Set[String] =
      ZConfig.getStringList("database_schema.table.permission_token.fields").toSet
    val objectSharingTokenFields: Set[String] =
      ZConfig.getStringList("database_schema.table.object_sharing_token.fields").toSet
    val geolocationFields: Set[String] =
      ZConfig.getStringList("database_schema.table.geolocation.fields").toSet
    val shareInfoFields: Set[String] =
      ZConfig.getStringList("database_schema.table.share_info.fields").toSet
    val deletedDirsFields: Set[String] =
      ZConfig.getStringList("database_schema.table.deleted_directory.fields").toSet
    val recentDirsFields: Set[String] =
      ZConfig.getStringList("database_schema.table.recent_directory.fields").toSet
    val starredDirsFields: Set[String] =
      ZConfig.getStringList("database_schema.table.starred_directory.fields").toSet
    val dashboardFieldTblField: Set[String] =
      ZConfig.getStringList("database_schema.table.dashboard_field.fields").toSet
    val rlsPolicyField: Set[String] =
      ZConfig.getStringList("database_schema.table.rls_policy.fields").toSet

    Future
      .collect(
        Seq(
          ensureDatabaseCreated(),
          ensureDashboardTable(tblDashboardName, dashboardFields),
          ensureDirectoryTable(tblDirectoryName, directoryFields),
          ensurePermissionTokenTable(tblPermissionTokenName, permissionTokenFields),
          ensureObjectSharingTokenTable(tblObjectSharingTokenName, objectSharingTokenFields),
          ensureGeolocationTable(tblGeolocation, geolocationFields),
          ensureShareInfoTable(tblShareInfoName, shareInfoFields),
          ensureDeletedDirectoryTable(tblDeletedDirsName, deletedDirsFields),
          ensureStarredDirectoryTable(tblStarredDirsName, starredDirsFields),
          ensureRecentDirectoryTable(tblRecentDirsName, recentDirsFields),
          ensureDashboardFieldTbl(tblDashboardField, dashboardFieldTblField),
          ensureRlsPolicyTable(tblRlsPolicy, rlsPolicyField)
        )
      )
      .map(results => results.forall(success => success))
  }

  private def ensureDatabaseCreated(): Future[Boolean] =
    Future {
      val isDbExist: Boolean = client.executeQuery(s"show databases like '$dbName';")(_.next())
      if (isDbExist) true
      else client.executeUpdate(s"create database $dbName;") >= 0
    }

  private def ensureDashboardTable(dashboardTblName: String, dashboardFields: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, dashboardTblName))
        isAllTblFieldValid(s"$dbName.$dashboardTblName", dashboardFields)
      else createDashboardTbl(dashboardTblName)
    }

  private def ensureDirectoryTable(directoryTblName: String, directoryFields: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, directoryTblName))
        isAllTblFieldValid(s"$dbName.$directoryTblName", directoryFields)
      else createDirectoryTbl(directoryTblName)
    }

  private def ensureDeletedDirectoryTable(
      deletedDirectoryTblName: String,
      deletedDirectoryFields: Set[String]
  ): Future[Boolean] =
    Future {
      if (isTblExist(dbName, deletedDirectoryTblName))
        isAllTblFieldValid(s"$dbName.$deletedDirectoryTblName", deletedDirectoryFields)
      else createDeletedDirectoryTbl(deletedDirectoryTblName)
    }

  private def ensurePermissionTokenTable(
      permissionTokenTblName: String,
      permissionTokenFields: Set[String]
  ): Future[Boolean] =
    Future {
      if (isTblExist(dbName, permissionTokenTblName))
        isAllTblFieldValid(s"$dbName.$permissionTokenTblName", permissionTokenFields)
      else createPermissionTokenTbl(permissionTokenTblName)
    }

  private def ensureObjectSharingTokenTable(
      objectSharingTokenTblName: String,
      objectSharingTokenFields: Set[String]
  ): Future[Boolean] =
    Future {
      if (isTblExist(dbName, objectSharingTokenTblName))
        isAllTblFieldValid(s"$dbName.$objectSharingTokenTblName", objectSharingTokenFields)
      else createSharingTokenInfoTbl(objectSharingTokenTblName)
    }

  private def ensureGeolocationTable(geolocationTblName: String, geolocationFields: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, geolocationTblName))
        isAllTblFieldValid(s"$dbName.$geolocationTblName", geolocationFields)
      else createGeolocationTbl(geolocationTblName)
    }

  private def ensureShareInfoTable(tblShareInfoName: String, shareInfoFields: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, tblShareInfoName)) {
        isAllTblFieldValid(s"$dbName.$tblShareInfoName", shareInfoFields)
      } else createShareInfoTbl(tblShareInfoName)
    }

  def ensureStarredDirectoryTable(
      starredDirectoryTblName: String,
      starredDirectoryFields: Set[String]
  ): Future[Boolean] =
    Future {
      if (isTblExist(dbName, starredDirectoryTblName)) {
        isAllTblFieldValid(s"$dbName.$starredDirectoryTblName", starredDirectoryFields)
      } else createStarredDirectoryTbl(starredDirectoryTblName)
    }

  def ensureRecentDirectoryTable(recentDirectoryTblName: String, recentDirectoryFields: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, recentDirectoryTblName)) {
        isAllTblFieldValid(s"$dbName.$recentDirectoryTblName", recentDirectoryFields)
      } else createRecentDirectoryTbl(recentDirectoryTblName)
    }

  def ensureDashboardFieldTbl(tblDashboardField: String, dashboardFieldTblField: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, tblDashboardField)) {
        isAllTblFieldValid(s"$dbName.$tblDashboardField", dashboardFieldTblField)
      } else createDashboardFieldTable(tblDashboardField)
    }

  def ensureRlsPolicyTable(tblRlsPolicy: String, rlsPolicyField: Set[String]): Future[Boolean] =
    Future {
      if (isTblExist(dbName, tblRlsPolicy)) {
        isAllTblFieldValid(s"$dbName.$tblRlsPolicy", rlsPolicyField)
      } else createRlsPolicyTable(tblRlsPolicy)
    }

  private[MySqlSchemaManager] def isTblExist(dbName: String, tblName: String): Boolean = {
    client.executeQuery(s"show tables from $dbName like '$tblName';")(_.next())
  }

  private def createDashboardTbl(dashboardTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$dashboardTblName(
         |id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |name VARCHAR(255) NOT NULL,
         |main_date_filter LONGTEXT,
         |widgets LONGTEXT,
         |widget_positions LONGTEXT,
         |creator_id TEXT,
         |owner_id TEXT,
         |boost_info LONGTEXT,
         |query_context LONGTEXT,
         |setting LONGTEXT
         |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
         |""".stripMargin) >= 0
  }

  private def createDirectoryTbl(directoryTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$directoryTblName(
         |id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |name VARCHAR(255) NOT NULL,
         |creator_id TEXT,
         |owner_id TEXT,
         |created_date BIGINT,
         |parent_id BIGINT,
         |is_removed BOOLEAN DEFAULT FALSE,
         |dir_type VARCHAR(255),
         |dashboard_id BIGINT,
         |updated_date BIGINT,
         |data LONGTEXT
         |) ENGINE=INNODB DEFAULT CHARSET=utf8;
         |""".stripMargin) >= 0
  }

  private def createPermissionTokenTbl(permissionTokenTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$permissionTokenTblName(
         |token_id VARCHAR(255) NOT NULL PRIMARY KEY,
         |creator VARCHAR(255) NOT NULL,
         |permissions LONGTEXT NOT NULL,
         |created_time BIGINT(20) NOT NULL DEFAULT '0'
         |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
         |""".stripMargin) >= 0
  }

  private def createSharingTokenInfoTbl(objectSharingTokenTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$objectSharingTokenTblName(
         |  `object_type` varchar(255) NOT NULL,
         |  `object_id` varchar(255) NOT NULL,
         |  `token_id` varchar(255) NOT NULL,
         |  PRIMARY KEY (`object_type`,`object_id`),
         |  KEY `object_sharing_token_FK` (`token_id`),
         |  CONSTRAINT `object_sharing_token_FK` FOREIGN KEY (`token_id`) REFERENCES `permission_token` (`token_id`) ON DELETE CASCADE ON UPDATE CASCADE
         |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
         |""".stripMargin) >= 0
  }

  private def createGeolocationTbl(geolocationTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$geolocationTblName(
         |  `code` VARCHAR(255) NOT NULL,
         |  `name` VARCHAR(255) NOT NULL,
         |  `normalized_name` VARCHAR(255) NOT NULL,
         |  `type` VARCHAR(255),
         |  `latitude` DOUBLE,
         |  `longitude` DOUBLE,
         |  `properties` LONGTEXT,
         |  PRIMARY KEY (code)
         |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
         |""".stripMargin) >= 0
  }

  def createShareInfoTbl(tblShareInfoName: String): Boolean = {
    client.executeUpdate(s"""
        |CREATE TABLE $dbName.$tblShareInfoName(
        |  `id` varchar(255) NOT NULL,
        |  `organization_id` bigint(20) NOT NULL,
        |  `resource_type` varchar(255) NOT NULL,
        |  `resource_id` varchar(255) NOT NULL,
        |  `username` varchar(255) NOT NULL,
        |  `created_at` bigint(20) DEFAULT NULL,
        |  `updated_at` bigint(20) DEFAULT NULL,
        |  `created_by` varchar(255) DEFAULT NULL,
        |  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
        |  `is_root` tinyint(1) NOT NULL DEFAULT '0',
        |  PRIMARY KEY (`id`)
        |) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        |""".stripMargin) >= 0
  }

  private def createDeletedDirectoryTbl(deletedDirectoryTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$deletedDirectoryTblName(
         |id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |name VARCHAR(255) NOT NULL,
         |creator_id TEXT,
         |owner_id TEXT,
         |created_date BIGINT,
         |parent_id BIGINT,
         |is_removed BOOLEAN DEFAULT FALSE,
         |dir_type VARCHAR(255),
         |dashboard_id BIGINT,
         |deleted_date BIGINT,
         |updated_date BIGINT,
         |data LONGTEXT
         |) ENGINE=INNODB DEFAULT CHARSET=utf8;
         |""".stripMargin) >= 0
  }

  def createStarredDirectoryTbl(starredDirectoryTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$starredDirectoryTblName(
         |`organization_id` BIGINT,
         |`username` VARCHAR(255),
         |`directory_id` BIGINT,
         |PRIMARY KEY (`organization_id`, `username`, `directory_id`)
         |) ENGINE=INNODB DEFAULT CHARSET=utf8;
         |""".stripMargin) >= 0
  }

  def createRecentDirectoryTbl(recentDirectoryTblName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$recentDirectoryTblName(
         |`organization_id` BIGINT,
         |`username` VARCHAR(255),
         |`directory_id` BIGINT,
         |`last_seen_time` BIGINT DEFAULT 0,
         |PRIMARY KEY (`organization_id`, `username`, `directory_id`)
         |) ENGINE=INNODB DEFAULT CHARSET=utf8;
         |""".stripMargin) >= 0
  }

  def createDashboardFieldTable(tableName: String): Boolean = {
    client.executeUpdate(s"""
      |create table $dbName.$tableName(
      |field_id VARCHAR(800) NOT NULL,
      |dashboard_id BIGINT NOT NULL,
      |field LONGTEXT NOT NULL,
      |PRIMARY KEY (`dashboard_id`, `field_id`)
      |) ENGINE=INNODB DEFAULT CHARSET=utf8;
      |""".stripMargin) >= 0
  }

  def createRlsPolicyTable(tableRlsPolicyName: String): Boolean = {
    client.executeUpdate(s"""
         |create table $dbName.$tableRlsPolicyName(
         |  policy_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |  org_id BIGINT,
         |  user_ids TEXT,
         |  user_attribute TEXT,
         |  db_name TINYTEXT,
         |  tbl_name TINYTEXT,
         |  conditions LONGTEXT
         |) ENGINE=INNODB DEFAULT CHARSET=utf8;
         |""".stripMargin) >= 0
  }

  private def isAllTblFieldValid(tableName: String, desiredFields: Set[String]): Boolean = {
    val actualFields: mutable.Set[String] = mutable.Set[String]()
    client.executeQuery(s"desc $tableName;")(rs => {
      while (rs.next()) actualFields.add(rs.getString("Field"))
    })
    desiredFields.forall(actualFields.contains)
  }

}

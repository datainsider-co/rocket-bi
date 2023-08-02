package co.datainsider.datacook.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.schema.module.SqlScriptModule.readSqlScript
import com.google.inject.name.Names
import com.twitter.inject.TwitterModule

import java.net.URL
import java.nio.file.Paths

/**
  * @author tvc12 - Thien Vi
  * @created 10/13/2021 - 5:35 PM
  */
object DataCookSqlScriptModule extends TwitterModule {
  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)

    val client: JdbcClient = injector.instance[JdbcClient](Names.named("mysql"))
    readSqlScript(getClass.getClassLoader.getResourceAsStream("sql/etl.sql"))(client.executeUpdate(_) >= 0)
    updateTableSchema(client)
  }

  /**
    * add config and operator info to table schema
    */
  private def updateTableSchema(client: JdbcClient): Unit = {
    val dbName: String = ZConfig.getString("data_cook.mysql.dbname")
    val jobTableName: String = ZConfig.getString("data_cook.mysql.job_table")
    val trashTableName: String = ZConfig.getString("data_cook.mysql.deleted_table")

    upgradeJobTable(client, dbName, jobTableName)
    upgradeJobTable(client, dbName, trashTableName)
  }

  private def upgradeJobTable(client: JdbcClient, dbName: String, tblName: String): Unit = {
    try {
      val columns = client.getColumns(null, dbName, tblName).toSet
      if (!columns.contains("config")) {
        client.executeUpdate(s"ALTER TABLE `$dbName`.`$tblName` ADD COLUMN `config` LONGTEXT")
      }
      if (!columns.contains("operator_info")) {
        client.executeUpdate(s"ALTER TABLE `$dbName`.`$tblName` ADD COLUMN `operator_info` LONGTEXT")
      }
    } catch {
      case ex: Throwable =>
        logger.error(s"MigrationDataCookModule::upgradeTable ${dbName}.${tblName} failure, cause ${ex.getMessage}", ex)
    }
  }

}

package co.datainsider.schema.service

import co.datainsider.bi.client.{NativeJDbcClient, NativeJdbcClientWithProperties}
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.repository.{MySqlSchemaMetadataStorage, SchemaRepository}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, async}

import java.util.Properties

case class MigrateRequest(
    orgId: Long,
    srcClickhouseHost: String,
    srcClickhousePort: Int,
    srcClickhouseUsername: String,
    srcClickhousePassword: String,
    srcMySqlHost: String,
    srcMySqlPort: Int,
    srcMySqlUsername: String,
    srcMySqlPassword: String,
    destClickhouseHost: String,
    destClickhousePort: Int,
    destClickhouseUsername: String,
    destClickhousePassword: String
) {
  def toMySqlUrl =
    s"jdbc:mysql://${srcMySqlHost}:${srcMySqlPort}?useUnicode=true&amp&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
}

/**
  * Usage example:
  *    val tool = injector.instance[MigrateDataTool]
  *    tool.migrate(
  *      MigrateRequest(
  *        orgId = 22,
  *        srcClickhouseHost = "118.69.169.48",
  *        srcClickhousePort = 9200,
  *        srcClickhouseUsername = "default",
  *        srcClickhousePassword = "",
  *        srcMySqlHost = "118.69.169.48",
  *        srcMySqlPort = 3306,
  *        srcMySqlUsername = "root",
  *        srcMySqlPassword = "di@2020!",
  *        destClickhouseHost = "34.101.114.204",
  *        destClickhousePort = 8123,
  *        destClickhouseUsername = "default",
  *        destClickhousePassword = ""
  *      )
  *    )
  */
trait MigrateDataTool {
  def migrate(request: MigrateRequest): Future[Unit]
}

class ClickhouseMigrateDataTool @Inject() (destSchemaRepository: SchemaRepository)
    extends MigrateDataTool
    with Logging {
  def migrate(request: MigrateRequest): Future[Unit] =
    async {
      val srcMysqlClient = NativeJDbcClient(request.toMySqlUrl, request.srcMySqlUsername, request.srcMySqlPassword)
      val sourceMetadataStorage = new MySqlSchemaMetadataStorage(srcMysqlClient)

      val sourceDbs: Seq[DatabaseSchema] = sourceMetadataStorage.getDatabases(request.orgId).syncGet()

      sourceDbs.foreach(db => {
        try {
          val isDbExisted = destSchemaRepository.isDatabaseExists(request.orgId, db.name, true).syncGet()

          if (!isDbExisted) {
            destSchemaRepository.createDatabase(request.orgId, db.name, db.displayName).syncGet()
          }

          db.tables.foreach(tbl => {
            try {
              destSchemaRepository.createTableOrOverrideSchema(tbl).syncGet()
              copyData(tbl, request)
              info(s"migrate done tbl: ${tbl.name}")
            } catch {
              case e: Throwable => error(s"migrate fail tbl: ${tbl.name}, message: ${e.getMessage}", e)
            }
          })
        } catch {
          case e: Throwable => error(s"migrate fail db: ${db.name}, message: ${e.getMessage}", e)
        }
      })
    }

  def copyData(tblSchema: TableSchema, request: MigrateRequest): Unit = {
    val sourceUrl = s"${request.srcClickhouseHost}:${request.srcClickhousePort}"

    val properties = new Properties()
    properties.setProperty("user", request.destClickhouseUsername)
    properties.setProperty("password", request.destClickhousePassword)
    properties.setProperty("connect_timeout_with_failover_ms", "1000")
    val client = NativeJdbcClientWithProperties(
      jdbcUrl = s"jdbc:clickhouse://${request.destClickhouseHost}:${request.destClickhousePort}",
      properties = properties
    )

    val removeOldDataQuery =
      s"""
         |truncate table ${tblSchema.dbName}.${tblSchema.name}
         |""".stripMargin

    client.executeUpdate(removeOldDataQuery)

    val copyDataQuery =
      s"""
        |INSERT INTO ${tblSchema.dbName}.${tblSchema.name}
        |SELECT * FROM remote('$sourceUrl', ${tblSchema.dbName}.${tblSchema.name})
        |""".stripMargin

    client.executeUpdate(copyDataQuery)
  }
}

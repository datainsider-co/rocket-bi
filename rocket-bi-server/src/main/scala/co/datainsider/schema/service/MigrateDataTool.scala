package co.datainsider.schema.service

import co.datainsider.bi.client.JdbcClient
import co.datainsider.schema.domain.{DatabaseSchema, TableType}
import co.datainsider.schema.repository.{DDLExecutor, SchemaMetadataStorage}
import com.twitter.inject.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike

import javax.inject.Inject
import scala.collection.mutable

// fixme: remove this class
@deprecated("use MigrateDataTool instead", "1.0.0")
class MigrateDataTool @Inject() (ddlExecutor: DDLExecutor, storage: SchemaMetadataStorage, client: JdbcClient)
    extends Logging {

  private val affectedTables = mutable.Map.empty[String, Int]

  /**
    * migrate data from one clickhouse cluster to another
    * @param orgId org to migrate data
    * @param sourceDbUrl <host>:<port>  E.g: 127.0.0.1:9001
    * @return
    */
  def startMigrate(orgId: Long, sourceDbUrl: String): Boolean = {

    val task = new Thread {
      override def run() {
        migrateData(orgId, sourceDbUrl)
      }
    }

    task.start()
    true
  }

  def getStats: mutable.Map[String, Int] = affectedTables

  private def migrateData(orgId: Long, sourceDbUrl: String): mutable.Map[String, Int] = {
    val databases: Seq[DatabaseSchema] = storage.getDatabases(orgId).syncGet()

    // reconstruct clickhouse tables according to table schemas
    databases.foreach(db => {
      val dbCreated: Boolean = ddlExecutor.createDatabase(db.name).syncGet()

      if (dbCreated) {
        db.tables.foreach(tblSchema => {
          try {
            val isTblExisted = ddlExecutor.existTableSchema(db.name, tblSchema.name).syncGet()

            if (!isTblExisted) {
              ddlExecutor.createTable(tblSchema).syncGet()
            }

            record(db.name, tblSchema.name, 0)

          } catch {
            case e: Throwable =>
              record("error::create", s"${db.name}.${tblSchema.name}", 1)
              logger.info(s"create table fail: $e")
          }
        })

      } else {
        logger.info(s"create db fail: ${db.name}")
      }
    })

    // insert data to tables
    databases.foreach(db => {
      db.tables.foreach(tblSchema => {

        // insert to normal tables only
        tblSchema.getTableType match {
          case TableType.Default =>
            try {
              val isTblExisted: Boolean = ddlExecutor.existTableSchema(db.name, tblSchema.name).syncGet()
              val currentNumRows: Int = getTotalRow(db.name, tblSchema.name)

              if (isTblExisted && currentNumRows == 0) {
                val query =
                  s"""
                       |INSERT INTO ${db.name}.${tblSchema.name}
                       |SELECT * FROM remote('$sourceDbUrl', ${db.name}.${tblSchema.name})
                       |""".stripMargin

                client.executeUpdate(query)

                val numRowInserted: Int = getTotalRow(db.name, tblSchema.name)
                record(db.name, tblSchema.name, numRowInserted)
              }
            } catch {
              case e: Throwable =>
                logger.error(s"insert to table failed: $e")
                record("error::insert", s"${db.name}.${tblSchema.name}", 1)
            }

          case _ => // do nothing
        }

      })
    })

    record("finish", "migration", 1)
    affectedTables
  }

  private def record(dbName: String, tblName: String, numRows: Int): Unit = {
    affectedTables.put(s"$dbName.$tblName", numRows)
  }

  private def getTotalRow(dbName: String, tblName: String): Int = {
    val countQuery = s"select count(*) from $dbName.$tblName"
    client.executeQuery(countQuery)(rs => if (rs.next()) rs.getInt(1) else 0)
  }

}

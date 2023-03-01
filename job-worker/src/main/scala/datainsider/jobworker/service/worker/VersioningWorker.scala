package datainsider.jobworker.service.worker

import com.google.inject.Inject
import com.twitter.inject.Logging
import datainsider.client.domain.schema.{DatabaseSchema, DatabaseShortInfo}
import datainsider.client.service.{OrgClientService, SchemaClientService}
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.ZConfig

import scala.collection.mutable.ArrayBuffer
import scala.util.matching.Regex

/**
  * versioning old table data after sync iterations
  * currently not support any version
  * old table will be delete after certain time amount
  */
trait VersioningWorker {
  def run(): Unit
}

class VersioningWorkerImpl @Inject() (schemaService: SchemaClientService, orgClientService: OrgClientService)
    extends VersioningWorker
    with Logging {
  override def run(): Unit = {
    try {
      // Todo: hardcode get list organization size = 1000
      val orgIds = orgClientService.getAllOrganizations(0, 1000).sync().data.map(_.organizationId)
      val databases: Seq[DatabaseShortInfo] = orgIds.flatMap(orgId => {
        schemaService.getDatabases(orgId).sync()
      })
      databases.foreach(db => {
        try {
          val tmpDbSchema: DatabaseSchema = schemaService.getTemporaryTables(db.organizationId, db.name).sync()
          tmpDbSchema.tables.foreach(tblSchema => deleteTmpTable(tblSchema.organizationId, db.name, tblSchema.name))
        } catch {
          case e: Throwable => error(s"delete old table fail: ${e}")
        }
      })
    } catch {
      case e: Throwable => logger.error(s"VersioningWorkerImpl exception: $e")
    }
  }

  private def deleteTmpTable(orgId: Long, dbName: String, tblName: String): Unit = {
    val oldTableRegex: Regex = """^__di_old_([\w]+)_(\d{13})$""".r
    val oldTblExistingTime = ZConfig.getLong("old_table_existing_time", 86400000)
    tblName match {
      case oldTableRegex(name, timestamp) =>
        if (System.currentTimeMillis() > timestamp.toLong + oldTblExistingTime) {
          logger.info(s"temporary table deleted: $name")
          schemaService.deleteTableSchema(orgId, dbName, tblName).sync()
        }
      case _ =>
    }
  }
}

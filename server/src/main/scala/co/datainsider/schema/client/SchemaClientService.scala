package co.datainsider.schema.client

import co.datainsider.bi.util.Implicits.{FutureEnhance, async}
import co.datainsider.common.client.exception.InternalError
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.domain.requests.TableFromQueryInfo
import co.datainsider.schema.domain.responses.TableExpressionsResponse
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema}
import co.datainsider.schema.service.SchemaService
import com.twitter.inject.Logging
import com.twitter.util.Future

import javax.inject.Inject
import scala.util.control.Breaks.{break, breakable}

/**
  * @author andy
  * @since 7/9/20
  */
trait SchemaClientService {
  def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]]

  def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema]

  def ensureDatabaseCreated(organizationId: Long, name: String, displayName: Option[String]): Future[Unit]

  def createOrMergeTableSchema(schema: TableSchema): Future[TableSchema]

  def renameTableSchema(organizationId: Long, dbName: String, tblName: String, newTblName: String): Future[Boolean]

  def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema]

  def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse]

  def isDbExists(organizationId: Long, dbName: String, useDdlQuery: Boolean): Future[Boolean]

  def isTblExists(organizationId: Long, dbName: String, tblName: String, columnNames: Seq[String]): Future[Boolean]

  def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def createTableSchema(schema: TableSchema): Future[TableSchema]

  def createTableFromQueryInfo(orgId: Long, tableInfo: TableFromQueryInfo): Future[TableSchema]

  def createDatabaseFromSchema(db: DatabaseSchema): Future[DatabaseSchema]
}

case class SchemaClientServiceImpl @Inject() (schemaService: SchemaService) extends SchemaClientService with Logging {

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    schemaService.getDatabases(organizationId)
  }

  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaService.getDatabaseSchema(organizationId, dbName)
  }

  override def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] = {
    schemaService.getTableSchema(organizationId, dbName, tblName)
  }

  override def createOrMergeTableSchema(schema: TableSchema): Future[TableSchema] = {
    for {
      _ <- schemaService.ensureDatabaseCreated(schema.organizationId, schema.dbName, None, useDdlQuery = true)
      tableSchema <- schemaService.createOrMergeTableSchema(schema)
      schemaOk <- ensureSchema(tableSchema.organizationId, tableSchema.dbName, tableSchema.name)
    } yield {
      if (schemaOk) tableSchema
      else throw InternalError(s"${this.getClass.getSimpleName}::createOrMergeTableSchema ensure table failed")
    }
  }

  override def ensureDatabaseCreated(organizationId: Long, name: String, displayName: Option[String]): Future[Unit] = {
    schemaService.ensureDatabaseCreated(organizationId, name, displayName, useDdlQuery = true)
  }

  override def renameTableSchema(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    for {
      renameOk <- schemaService.renameTableSchema(organizationId, dbName, tblName, newTblName)
      schemaOk <- ensureSchema(organizationId, dbName, newTblName)
    } yield {
      if (schemaOk) renameOk
      else throw InternalError(s"${this.getClass.getSimpleName}::renameTableSchema ensure table failed")
    }
  }

  override def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    schemaService.deleteTableSchema(organizationId, dbName, tblName)
  }

  override def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaService.getTemporaryTables(organizationId, dbName)
  }

  override def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] = {
    schemaService.mergeSchemaByProperties(organizationId, dbName, tblName, properties)
  }

  override def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse] = {
    schemaService.getExpressions(dbName, tblName).rescue {
      case e: Throwable => Future(TableExpressionsResponse(dbName, tblName, Map.empty))
    }
  }

  override def isDbExists(organizationId: Long, dbName: String, useDdlQuery: Boolean): Future[Boolean] = {
    schemaService.isDatabaseExists(organizationId, dbName, useDdlQuery)
  }

  override def isTblExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnNames: Seq[String]
  ): Future[Boolean] = {
    schemaService.isTableExists(organizationId, dbName, tblName, useDdlQuery = true)
  }

  val maxRetryTimes: Int = ZConfig.getInt("cluster_ddl.max_retry_times", 60)
  val waitTimeMs: Int = ZConfig.getInt("cluster_ddl.wait_time_ms", 1000)

  private def ensureSchema(isSchemaOk: => Boolean): Boolean = {
    var retryCount = 0

    breakable {
      do {
        if (isSchemaOk) {
          break
        } else {
          retryCount += 1
          Thread.sleep(waitTimeMs)
        }
      } while (retryCount < maxRetryTimes)
    }

    if (retryCount >= maxRetryTimes) {
      logger.error(s"ensureSchema fail after $maxRetryTimes")
      false
    } else {
      true
    }
  }

  private def ensureSchema(orgId: Long, dbName: String, tblName: String): Future[Boolean] =
    async {
      ensureSchema(
        isTblExists(
          organizationId = orgId,
          dbName = dbName,
          tblName = tblName,
          columnNames = Seq.empty
        ).syncGet()
      )
    }

  override def createTableSchema(schema: TableSchema): Future[TableSchema] = schemaService.createTableSchema(schema)

  override def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaService.deleteDatabase(organizationId, dbName)
  }

  override def createTableFromQueryInfo(orgId: Long, tableInfo: TableFromQueryInfo): Future[TableSchema] = {
    schemaService.createTableSchema(orgId, tableInfo)
  }

  override def createDatabaseFromSchema(db: DatabaseSchema): Future[DatabaseSchema] = {
    schemaService.createDatabaseFromSchema(db)
  }
}



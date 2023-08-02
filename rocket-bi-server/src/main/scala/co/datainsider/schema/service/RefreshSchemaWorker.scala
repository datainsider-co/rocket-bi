package co.datainsider.schema.service

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.repository.{DDLExecutor, SchemaMetadataStorage}
import co.datainsider.schema.service.StageName.StageName
import co.datainsider.schema.service.StageStatus.StageStatus
import com.twitter.util.logging.Logging
import com.twitter.util.{Future, TimeoutException}

import java.util.concurrent.ConcurrentHashMap
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

case class RefreshSchemaStage(
    orgId: Long,
    name: StageName,
    progress: Int = 0,
    total: Int = 0,
    status: StageStatus = StageStatus.Running,
    message: String = "",
    stages: Seq[RefreshSchemaStage] = Seq.empty[RefreshSchemaStage],
    createdTime: Long = System.currentTimeMillis()
)

object StageName {
  type StageName = String
  val TestConnection: StageName = "test_connection"
  val ScanDatabase: StageName = "scan_database"
  val ScanTable: StageName = "scan_table"
  val Completed: StageName = "completed"
}

object StageStatus {
  type StageStatus = String
  val NotStarted: StageStatus = "not_started"
  val Running: StageStatus = "running"
  val Success: StageStatus = "success"
  val Error: StageStatus = "error"
  val Terminated: StageStatus = "terminated"
}

/**
  * Trait handle refresh schema and notify progress
  */
trait RefreshSchemaWorker {

  /**
    * Run refresh schema for organization, if there is a schema is refreshing, then skip this request
    * @param orgId organization id want to refresh schema
    * @param getConnection function to get connection
    * @param reportFn function to report progress
    */
  def run(orgId: Long, getConnection: (Long) => Future[Connection], reportFn: (RefreshSchemaStage) => Unit): Unit

  /**
    * wait refresh schema for organization, if timeout then throw TimeoutException
    * @param orgId organization id want to stop refresh schema
    */
  @throws[TimeoutException]
  def waitStop(orgId: Long, timeoutMs: Long): Unit

  def isRunning(orgId: Long): Boolean
}

class RefreshSchemaWorkerImpl(
    engineResolver: EngineResolver,
    storage: SchemaMetadataStorage,
    sleepWaitStopIntervalMs: Long = 500
) extends RefreshSchemaWorker
    with Logging {
  private val isRunningMap = new ConcurrentHashMap[Long, Boolean]()
  private val idsToTerminateSet = mutable.Set.empty[Long]
  override def run(orgId: Long, getConnection: (Long) => Future[Connection], report: (RefreshSchemaStage) => Unit): Unit = {
    if (!isRunning(orgId)) {
      try {
        setRunning(orgId, isRunning = true)
        process(orgId, getConnection, report)
      } finally {
        setRunning(orgId, isRunning = false)
        idsToTerminateSet.remove(orgId)
      }
    }
  }

  private def process(orgId: Long, getConnection: (Long) => Future[Connection], report: RefreshSchemaStage => Unit): Unit = {
    try {
      logger.info(s"${Thread.currentThread().getName}Start refresh schema for source: $orgId")
      ensureRunning(orgId)
      val connection: Connection = getConnection(orgId).syncGet()
      val engine: Engine[Connection] = engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
      testConnection(orgId, engine, connection, report)
      ensureRunning(orgId)
      scanAndUpdateDatabases(orgId, engine.getDDLExecutor(connection), report)
      report(
        RefreshSchemaStage(
          orgId = orgId,
          name = StageName.Completed,
          status = StageStatus.Success
        )
      )
    } catch {
      case ex: InterruptedException => {
        report(
          RefreshSchemaStage(
            orgId = orgId,
            name = StageName.Completed,
            status = StageStatus.Terminated,
            message = ex.getMessage
          )
        )
      }
      case ex: Throwable => {
        logger.debug(s"${Thread.currentThread().getName} Stop refresh schema for orgId: $orgId")
        report(
          RefreshSchemaStage(
            orgId = orgId,
            name = StageName.Completed,
            status = StageStatus.Error,
            message = ex.getMessage
          )
        )
      }
    }
  }

  private def testConnection(
      orgId: Long,
      engine: Engine[Connection],
      source: Connection,
      report: (RefreshSchemaStage) => Unit
  ): Unit = {
    val stage = RefreshSchemaStage(
      orgId = orgId,
      progress = 0,
      total = 1,
      name = StageName.TestConnection,
      status = StageStatus.Running
    )
    report(stage)
    engine.testConnection(source).syncGet()
    report(stage.copy(status = StageStatus.Success, progress = 1))
  }

  private def scanAndUpdateDatabases(
      orgId: Long,
      ddlExecutor: DDLExecutor,
      report: (RefreshSchemaStage) => Unit
  ): Unit = {
    val stage = RefreshSchemaStage(
      orgId = orgId,
      name = StageName.ScanDatabase,
      status = StageStatus.Running
    )
    report(stage)
    val originDbNames: Set[String] = ddlExecutor.getDbNames().syncGet().toSet
    report(stage.copy(total = originDbNames.size))
    dropDatabaseNotExists(orgId, originDbNames)
    val updateTableStages = ArrayBuffer.empty[RefreshSchemaStage]
    var progress: Int = 0
    originDbNames.foreach((dbName: String) => {
      progress += 1
      val updateTableStage: RefreshSchemaStage = scanAndUpdateTables(orgId, ddlExecutor, dbName)
      updateTableStages += updateTableStage
      report(stage.copy(progress = progress, total = originDbNames.size, stages = updateTableStages))
    })
    report(
      stage.copy(
        progress = progress,
        total = originDbNames.size,
        status = StageStatus.Success,
        stages = updateTableStages
      )
    )
  }

  private def scanAndUpdateTables(orgId: Long, ddlExecutor: DDLExecutor, dbName: String): RefreshSchemaStage = {
    var totalTables = 0
    try {
      ensureRunning(orgId)
      val tableSchemas: Seq[TableSchema] = ddlExecutor.scanTables(orgId, dbName).syncGet()
      totalTables = tableSchemas.size
      ensureRunning(orgId)
      ensureCreatedTables(orgId, dbName, tableSchemas)
      RefreshSchemaStage(
        orgId = orgId,
        progress = tableSchemas.size,
        total = totalTables,
        name = StageName.ScanTable,
        status = StageStatus.Success,
        message = s"Scan tables in database: $dbName success"
      )
    } catch {
      case ex: InterruptedException => throw ex
      case ex: Throwable =>
        logger.debug(s"Error when scan tables in database: $dbName", ex)
        RefreshSchemaStage(
          orgId = orgId,
          name = StageName.ScanTable,
          status = StageStatus.Error,
          total = totalTables,
          message = s"Error when scan tables in database: $dbName, ${ex.getMessage}"
        )
    }
  }

  /**
    * Drop all unknown databases in di-system
    */
  private def dropDatabaseNotExists(organizationId: Long, originDbNames: Set[String]): Unit = {
    try {
      val databases: Seq[DatabaseSchema] = storage.getDatabases(organizationId).syncGet()
      val results: Seq[Future[Boolean]] =
        databases.filter(db => !originDbNames.contains(db.name)).map(db => storage.hardDelete(organizationId, db.name))
      Future.collect(results).syncGet()
    } catch {
      case ex: Throwable => logger.error("Error when drop unknown databases in di-system", ex)
    }
  }

  private def ensureCreatedTables(
      orgId: Long,
      dbName: String,
      originTables: Seq[TableSchema]
  ): Unit = {
    val isDbExisted: Boolean = storage.isExists(orgId, dbName).syncGet()
    if (isDbExisted) {
      val databaseInStorage: DatabaseSchema = storage.getDatabaseSchema(orgId, dbName).syncGet()
      val database: DatabaseSchema = databaseInStorage.copy(
        tables = mergeTables(originTables, databaseInStorage.tables),
        updatedTime = System.currentTimeMillis()
      )
      Try(storage.hardDelete(orgId, dbName).syncGet())
      storage.addDatabase(orgId, database).syncGet()
    } else {
      val database: DatabaseSchema = DatabaseSchema(
        dbName,
        orgId,
        displayName = dbName,
        createdTime = System.currentTimeMillis(),
        updatedTime = System.currentTimeMillis(),
        tables = originTables
      )
      storage.addDatabase(orgId, database).syncGet()
    }
  }

  private def mergeTables(
      originTables: Seq[TableSchema],
      diTables: Seq[TableSchema]
  ): Seq[TableSchema] = {
    val diTableMap: Map[String, TableSchema] = diTables.map(tableSchema => tableSchema.name -> tableSchema).toMap

    val tableSchemas: Seq[TableSchema] = originTables
      .map((originTable: TableSchema) => {
        diTableMap.get(originTable.name) match {
          case Some(diTable) =>
            val mergedTable: TableSchema = originTable.copy(
              columns = mergeColumns(originTable.columns, diTable.columns),
              expressionColumns = diTable.expressionColumns,
              calculatedColumns = diTable.calculatedColumns,
            )
            Some(mergedTable)
          case _ => Some(originTable)
        }
      })
      .filter(_.isDefined)
      .map(_.get)
    tableSchemas
  }

  /**
    * Merge columns from source to di-system, keep meta data from di-system
    */
  private def mergeColumns(originColumns: Seq[Column], diColumns: Seq[Column]): Seq[Column] = {
    val diColumnsMap: Map[String, Column] = diColumns.map(column => column.name -> column).toMap
    originColumns.map(originColumn => {
      diColumnsMap.get(originColumn.name) match {
        case Some(diColumn) => diColumn
        case _              => originColumn
      }
    })
  }

  override def waitStop(orgId: Long, timeoutMs: Long): Unit = {
    require(timeoutMs > 0, "timeoutMs must be positive")
    if (isRunning(orgId)) {
      idsToTerminateSet.add(orgId)
      val startTime = System.currentTimeMillis()
      while (isRunning(orgId)) {
        if (System.currentTimeMillis() - startTime > timeoutMs) {
          throw new TimeoutException(s"Wait stop refresh schema job timeout, orgId: $orgId")
        }
        Thread.sleep(sleepWaitStopIntervalMs)
      }
    }
  }

  override def isRunning(orgId: Long): Boolean = {
    isRunningMap.getOrDefault(orgId, false)
  }

  private def setRunning(orgId: Long, isRunning: Boolean): Unit = {
    isRunningMap.put(orgId, isRunning)
  }

  private def ensureRunning(orgId: Long): Unit = {
    if (!isRunning(orgId) || idsToTerminateSet.contains(orgId)) {
      throw new InterruptedException("Refresh schema job is stopped by user")
    }
  }
}

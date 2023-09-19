package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.{JdbcClient, NativeJdbcClientWithProperties}
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.job.GenericJdbcJob
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.domain.{GenericJdbcProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.repository.JdbcReader
import co.datainsider.jobworker.repository.reader.GenericJdbcReader
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.JdbcUtils
import co.datainsider.jobworker.util.JdbcUtils.getSQLDataTypeExpr
import co.datainsider.jobworker.util.StringUtils.getOriginTblName
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import com.twitter.inject.Logging
import com.twitter.util.Future
import education.x.commons.KVS

import java.util.Properties
import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class GenericJdbcWorker(
    dataSource: JdbcSource,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    engine: Engine[ClickhouseConnection],
    connection: ClickhouseConnection
) extends JobWorker[GenericJdbcJob]
    with Logging {

  private val isRunning: AtomicBoolean = new AtomicBoolean(true)
  private val properties = new Properties()
  properties.setProperty("user", connection.username)
  properties.setProperty("password", connection.password)
  connection.properties.foreach { case (k, v) => properties.setProperty(k, v) }
  private val clickhouseClient: JdbcClient = NativeJdbcClientWithProperties(connection.toJdbcUrl, properties)
  private val clickhouseInputUrl: String = buildClickhouseInputUrl(dataSource)

  override def run(job: GenericJdbcJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {

    info(s"Start syncing job: $job")
    var lastSyncedValue: String = job.lastSyncedValue
    var rowInserted: Int = 0
    val beginTime: Long = System.currentTimeMillis()
    val batchSize = ZConfig.getInt("sync_batch_size", 10000).max(job.maxFetchSize)
    val reportInterval = batchSize * 1 // report every n batches
    val jobProgress =
      GenericJdbcProgress(
        job.orgId,
        syncId,
        job.jobId,
        beginTime,
        JobStatus.Syncing,
        0,
        System.currentTimeMillis() - beginTime,
        job.lastSyncedValue
      )

    try {
      onProgress(jobProgress)
      val newTableSchema: TableSchema = getTableSchema(clickhouseInputUrl, job)
      val oldTableSchema: Option[TableSchema] = getDestTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
      val tableSchema: TableSchema = mergeTableSchema(newTableSchema, oldTableSchema)
      val bridgeTableName: String = createBridgeTable(tableSchema, job)
      val reader: JdbcReader = GenericJdbcReader(clickhouseClient, job.copy(tableName = bridgeTableName), batchSize)
      val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))

      schemaService.createOrMergeTableSchema(tableSchema).sync()

      def report(): Unit = {
        // report sync status to job-scheduler
        if (rowInserted % reportInterval == 0) {
          val batchSyncedSucceed: JobProgress = jobProgress.copy(
            updatedTime = System.currentTimeMillis(),
            totalSyncRecord = rowInserted,
            totalExecutionTime = System.currentTimeMillis() - beginTime,
            lastSyncedValue = lastSyncedValue
          )
          onProgress(batchSyncedSucceed)
        }

        // check terminate signal from job-scheduler
        jobInQueue.get(syncId).map {
          case Some(value) => isRunning.set(value)
          case None        =>
        }
      }

      while (reader.hasNext && isRunning.get()) {
        try {
          val records: Seq[Record] = reader.next
          writers.foreach(writer => {
            if (records.nonEmpty) try {
              writer.insertBatch(records, tableSchema)
            } catch {
              case e: Throwable => error(s"${writer.getClass} write ${records.length} records failed, reason: $e")
            }
          })

          rowInserted += records.length
          lastSyncedValue = reader.getLastSyncedValue
          report()
        } catch {
          case e: Throwable => error(s"error when sync, last synced value: $lastSyncedValue", e)
        }
      }

      writers.foreach(_.close())

      val finalStatus: JobStatus =
        if (isRunning.get()) {
          JobStatus.Synced
        } else {
          JobStatus.Terminated
        }

      jobProgress.copy(
        jobStatus = finalStatus,
        updatedTime = System.currentTimeMillis(),
        totalSyncRecord = rowInserted,
        totalExecutionTime = System.currentTimeMillis() - beginTime,
        lastSyncedValue = lastSyncedValue
      )
    } catch {
      case e: Throwable =>
        info(s"got error when sync data, message: $e")
        jobProgress.copy(
          jobStatus = JobStatus.Error,
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = 0,
          totalExecutionTime = System.currentTimeMillis() - beginTime,
          lastSyncedValue = lastSyncedValue,
          message = Some(e.getMessage)
        )
    } finally {
      jobInQueue.remove(syncId)
      dropBridgeTable(job.destDatabaseName, buildTempTableName(job.destTableName))
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  private def getTableSchema(clickhouseInputUrl: String, job: GenericJdbcJob): TableSchema = {
    val query: String = job.query match {
      case Some(value) => s"select * from jdbc('$clickhouseInputUrl', '', '$value') limit 1"
      case None        => s"select * from jdbc('$clickhouseInputUrl', '${job.databaseName}', '${job.tableName}') limit 1"
    }
    clickhouseClient.executeQuery(query)(rs => {
      TableSchema(
        name = job.destTableName,
        dbName = job.destDatabaseName,
        organizationId = job.orgId,
        displayName = getOriginTblName(job.destTableName),
        columns = JdbcUtils.getColumnsFromResultSet(rs)
      )
    })
  }

  private def createBridgeTable(tableSchema: TableSchema, job: GenericJdbcJob): String = {
    // Todo: ingestion service handle this logic
    val engine: String = job.query match {
      case Some(value) => s"JDBC('$clickhouseInputUrl', '', '$value')"
      case None        => s"JDBC('$clickhouseInputUrl', '${job.databaseName}', '${job.tableName}')"
    }
    val bridgeTableName: String = buildTempTableName(tableSchema.name)
    val createBridgeTableQuery =
      s"""
         |CREATE TABLE IF NOT EXISTS `${tableSchema.dbName}`.`$bridgeTableName`(
         |${buildMultiColumnDDL(tableSchema.columns)}
         |) ENGINE = $engine;
         |""".stripMargin
    clickhouseClient.executeUpdate(createBridgeTableQuery)
    bridgeTableName
  }

  private def dropBridgeTable(dbName: String, tblName: String): Unit = {
    clickhouseClient.executeUpdate(s"DROP TABLE IF EXISTS $dbName.$tblName")
  }

  override def mergeTableSchema(sourceTable: TableSchema, destTableOption: Option[TableSchema]): TableSchema = {
    destTableOption match {
      case None => sourceTable
      case Some(oldTable) =>
        val newColumns: Seq[Column] = updateColumnsMetadata(sourceTable.columns, oldTable.columns)
        oldTable.copy(columns = newColumns)
    }
  }

  private def updateColumnsMetadata(newColumns: Seq[Column], oldColumns: Seq[Column]): Seq[Column] = {
    newColumns.map(newColumn => {
      oldColumns.find(_.name.equals(newColumn.name)) match {
        case None            => newColumn
        case Some(oldColumn) => oldColumn
      }
    })
  }

  private def getDestTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    var retry: Int = ZConfig.getInt("generic_jdbc_worker.get_dest_database_schema.retry_time", 3)
    var tableAsOption: Option[TableSchema] = None
    var isSuccess: Boolean = false
    while ((retry > 0) && (!isSuccess)) {
      try {
        val databaseSchema: DatabaseSchema = schemaService.getDatabaseSchema(organizationId, dbName).sync()
        tableAsOption = databaseSchema.findTableAsOption(tblName)
        isSuccess = true
      } catch {
        case ex: Throwable => error(s"got fail to get dest table, ${ex.getMessage}")
      }
      retry = retry - 1
    }
    if (isSuccess) {
      tableAsOption
    } else {
      throw new Exception(s"fail to interact with ingestion-service when ensure destination table")
    }
  }

  private def buildClickhouseInputUrl(dataSource: JdbcSource): String = {
    dataSource.jdbcUrl + "?" + s"user=${dataSource.username}&password=${dataSource.password}"
  }

  private def buildTempTableName(tableName: String) = {
    "__clickhouse_bridge" + tableName
  }

  private def buildMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(column => s"`${column.name}` ${getSQLDataTypeExpr(column)}")
      .filterNot(_ == null)
      .filterNot(_.isEmpty)
      .mkString(",\n")
  }
}

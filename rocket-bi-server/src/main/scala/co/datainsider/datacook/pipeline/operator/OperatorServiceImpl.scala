package co.datainsider.datacook.pipeline.operator
import co.datainsider.bi.domain.chart.{ChartSetting, TableColumn}
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.service.QueryExecutor
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.requests.TableFromQueryInfo
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema, TableType}
import co.datainsider.schema.misc.ClickHouseUtils
import co.datainsider.schema.service.{IngestionService, SchemaService}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, async}
import datainsider.client.exception.{DbNotFoundError, InternalError}

import scala.collection.mutable.ArrayBuffer
import scala.util.Try

/**
  * created 2023-09-21 10:18 AM
  * @author tvc12 - Thien Vi
  */

class OperatorServiceImpl(
    schemaService: SchemaService,
    queryExecutor: QueryExecutor,
    ingestionService: IngestionService,
    dbPrefix: String,
    querySize: Int = 1000,
    batchSize: Int = 100000,
    maxRetryTimes: Int = 10,
    sleepInterval: Int = 500
) extends OperatorService
    with Logging {

  private val DB_DISPLAY_NAME = "ETL Database"

  private val clazz: String = getClass.getSimpleName

  def createViewTable(
      organizationId: OrganizationId,
      id: EtlJobId,
      query: Query,
      config: DestTableConfig,
      aliasDisplayNames: Seq[String] = Seq.empty
  ): Future[TableSchema] =
    Profiler(s"[${clazz}]::creatViewTable") {
      for {
        dbName: String <- Future.value(getDbName(organizationId, id))
        isExisted <- schemaService.isTableExists(organizationId, dbName, config.tblName)
        tableSchema <- isExisted match {
          case true => schemaService.getTableSchema(organizationId, dbName, config.tblName)
          case _    => ensureViewTable(organizationId, id, query, config, aliasDisplayNames)
        }
      } yield tableSchema
    }

  private def ensureViewTable(
      organizationId: OrganizationId,
      id: EtlJobId,
      query: Query,
      config: DestTableConfig,
      aliasDisplayNames: Seq[String] = Seq.empty
  ): Future[TableSchema] = {
    for {
      tableInfo <- buildTableInfo(organizationId, id, query, config, aliasDisplayNames)
      _ <- ensureDatabase(organizationId, getDbName(organizationId, id))
      tableSchema <- schemaService.createTableSchema(organizationId, tableInfo)
    } yield tableSchema
  }

  private def buildTableInfo(
      organizationId: OrganizationId,
      id: EtlJobId,
      query: Query,
      destTableConfig: DestTableConfig,
      aliasDisplayNames: Seq[String]
  ): Future[TableFromQueryInfo] = {
    queryExecutor
      .parseQuery(organizationId, query)
      .map(queryAsString => {
        TableFromQueryInfo(
          dbName = getDbName(organizationId, id),
          tblName = destTableConfig.tblName,
          displayName = destTableConfig.tblDisplayName,
          query = queryAsString,
          tableType = TableType.View,
          aliasDisplayNames = aliasDisplayNames
        )
      })
  }

  private def ensureDatabase(organizationId: OrganizationId, dbName: String): Future[Unit] = {
    for {
      isDDLExists <- schemaService.isDatabaseExists(organizationId, dbName, useDdlQuery = true)
      isStorageExists <- schemaService.isDatabaseExists(organizationId, dbName)
      result <- (isStorageExists, isDDLExists) match {
        case (true, true) => Future.Unit
        case _            => schemaService.addDatabase(buildDatabaseSchema(organizationId, dbName))
      }
    } yield result
  }

  private def buildDatabaseSchema(organizationId: OrganizationId, dbName: String): DatabaseSchema = {
    DatabaseSchema(
      name = dbName,
      organizationId = organizationId,
      displayName = DB_DISPLAY_NAME,
      createdTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      tables = Seq.empty
    )
  }

  def dropETLDatabase(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    schemaService.deleteDatabase(organizationId, dbName)
  }

  def createTable(
      organizationId: OrganizationId,
      id: EtlJobId,
      querySetting: ChartSetting,
      destTableConfig: DestTableConfig
  ): Future[TableSchema] =
    Profiler(s"[${clazz}]::createTable") {
      for {
        tempSchema: TableSchema <- detectTableSchema(organizationId, id, querySetting, destTableConfig)
        tableSchema <- ensureCreatedTable(tempSchema)
      } yield tableSchema
    }

  private def ensureCreatedTable(tableSchema: TableSchema): Future[TableSchema] = {
    for {
      _ <- ensureDatabase(tableSchema.organizationId, tableSchema.dbName)
      isExisted <- schemaService.isTableExists(tableSchema.organizationId, tableSchema.dbName, tableSchema.name)
      finalTableSchema <- isExisted match {
        case true => Future.value(tableSchema)
        case _    => schemaService.createTableSchema(tableSchema)
      }
    } yield finalTableSchema
  }

  private def detectTableSchema(
      organizationId: OrganizationId,
      id: EtlJobId,
      querySetting: ChartSetting,
      destTableConfig: DestTableConfig
  ): Future[TableSchema] = {
    for {
      dataTable: DataTable <- executeQuery(organizationId, querySetting, Some(Limit(0, 50)))
      columns: Seq[Column] = OperatorService.detectColumns(querySetting, dataTable)
    } yield TableSchema(
      organizationId = organizationId,
      name = destTableConfig.tblName,
      displayName = destTableConfig.tblDisplayName,
      dbName = getDbName(organizationId, id),
      columns = columns,
      tableType = Some(TableType.Default)
    )
  }

  private def executeQuery(
      organizationId: Long,
      querySetting: ChartSetting,
      limit: Option[Limit] = None
  ): Future[DataTable] = {
    val query: Query = querySetting.toQuery.setLimit(limit)
    val tableColumns: Array[TableColumn] = querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
    queryExecutor.executeQuery(organizationId, query, tableColumns)
  }

  private def canGetNext(data: DataTable, itemSize: Int): Boolean =
    data.records.nonEmpty && itemSize <= data.records.length

  /**
    * Wait Table insert completed, if n time retry greater than max retry then function will end
    */
  private def waitIngestCompleted(orgId: Long, dbName: String, tblName: String, nInsertedRow: Long): Unit =
    Profiler(s"[${clazz}]::waitIngestCompleted") {
      var isRunning: Boolean = false
      var retryTime: Int = 0
      do {
        val totalRow: Long = getTotalRow(orgId, dbName, tblName).syncGet()
        isRunning = totalRow < nInsertedRow && retryTime < maxRetryTimes
        if (isRunning) {
          retryTime += 1
          Thread.sleep(sleepInterval)
        }
      } while (isRunning)
      logger.info(s"waitUntilIngestCompleted:: ${dbName}.${tblName} completed")
    }

  private def getTotalRow(orgId: Long, dbName: String, tblName: String): Future[Long] = {
    val query = ObjectQuery(
      functions = Seq(CountAll()),
      queryViews = Seq(TableView(dbName, tblName))
    )
    queryExecutor
      .executeQuery(orgId, query, Array.empty)
      .map(dataTable => {
        if (dataTable.records.nonEmpty && dataTable.records.head.nonEmpty) {
          Try(dataTable.records.head.head.toString.toLong).getOrElse(0L)
        } else {
          0L
        }
      })
  }

  /**
    * insert data from query
    */
  private def ingest(fromChartSetting: ChartSetting, destTableSchema: TableSchema): Future[Unit] =
    async {
      Profiler(s"[${clazz}]::ingest") {
        val ordId: Long = destTableSchema.organizationId
        val destDbName: String = destTableSchema.dbName
        val destTable: String = destTableSchema.name
        try {
          logger.info(s"ingest::start table ${destDbName}.${destTable}")
          val insertedRows: Long = loadBatchData(ordId, fromChartSetting, batchSize)((records: Seq[Array[Any]]) => {
              ingestionService.ingest(destTableSchema, records = records)
            })
          waitIngestCompleted(ordId, destDbName, destTable, insertedRows)
          logger.info(s"ingest::end ${destDbName}.${destTable}, inserted rows ${insertedRows}")
        } catch {
          case ex: Throwable =>
            logger.error(s"insertData:: orgId: $ordId, dbName: $destDbName, tblName: $destTable", ex)
            throw InternalError(
              s"Insert data into table ${destDbName}.${destTable} failure, cause: ${ex.getMessage}",
              ex
            )
        }
      }
    }

  private def loadBatchData(
      orgId: Long,
      fromChartSetting: ChartSetting,
      batchSize: Int
  )(ingestFn: (Seq[Array[Any]]) => Future[Int]): Long = {
    var offset = 0
    var isRunning = true;
    var records = ArrayBuffer[Array[Any]]()
    var nInsertedRow = 0
    do {
      val dataTable: DataTable = executeQuery(orgId, fromChartSetting, Some(Limit(offset, querySize))).syncGet()
      records.appendAll(dataTable.records.toSeq.asInstanceOf[Seq[Array[Any]]])
      offset += querySize
      isRunning = canGetNext(dataTable, querySize)
      // run
      if (records.size >= batchSize) {
        nInsertedRow = ingestFn(records).syncGet()
        records = ArrayBuffer()
      }
    } while (isRunning)

    // empty
    if (records.nonEmpty) {
      nInsertedRow = ingestFn(records).syncGet()
    }
    nInsertedRow
  }

  /**
    * Insert data from query to table if table is empty
    */
  def ingestIfTableEmpty(fromChartSetting: ChartSetting, destTableSchema: TableSchema): Future[Unit] =
    Profiler(s"[${clazz}]::ingestIfTableEmpty") {
      getTotalRow(destTableSchema.organizationId, destTableSchema.dbName, destTableSchema.name).flatMap(total => {
        if (total <= 0) {
          ingest(fromChartSetting, destTableSchema)
        } else {
          Future.Unit
        }
      })
    }

  def removeTables(organizationId: OrganizationId, id: EtlJobId, tblNames: Array[String]): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    val results: Array[Future[Boolean]] = tblNames.map(tblName => {
      schemaService
        .renameTableSchema(
          organizationId = organizationId,
          dbName = dbName,
          tblName = tblName,
          newTblName = TableSchema.buildOldTblName(tblName)
        )
        .rescue({
          case ex: Throwable =>
            logger.error(s"removeTables:: orgId: $organizationId, dbName: $dbName, tblName: $tblName", ex)
            Future.False
        })
    })
    Future.collect(results).map(_.forall(_ == true))
  }

  def removeAllTables(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    val result: Future[Boolean] = for {
      database <- fetchDatabase(organizationId, dbName)
      result <- removeTables(organizationId, id, database.tables.map(_.name).toArray)
    } yield result
    result.rescue {
      case ex: Throwable =>
        logger.error(s"removeAllTables:: orgId: $organizationId, dbName: $dbName", ex)
        Future.False
    }
  }

  @throws[DbNotFoundError]("if not found")
  private def fetchDatabase(organizationId: OrganizationId, dbName: String): Future[DatabaseSchema] = {
    for {
      isDDLExists <- schemaService.isDatabaseExists(organizationId, dbName, useDdlQuery = true)
      isStorageExists <- schemaService.isDatabaseExists(organizationId, dbName)
      result <- (isDDLExists && isStorageExists) match {
        case true => schemaService.getDatabaseSchema(organizationId, dbName)
        case _    => Future.exception(DbNotFoundError(s"Database $dbName not found"))
      }
    } yield result
  }

  def getDbName(organizationId: OrganizationId, id: EtlJobId): String = {
    ClickHouseUtils.buildDatabaseName(organizationId, s"${dbPrefix}_${id}")
  }

  def getTableSchema(organizationId: OrganizationId, dbName: String, tblName: String): Future[TableSchema] = {
    schemaService.getTableSchema(organizationId, dbName, tblName)
  }

  def getMaxValue(orgId: Long, dbName: String, tblName: String, columnName: String, columnType: String): Future[String] = {
    val query = ObjectQuery(
      functions = Seq(
        Max(
          field = TableField(
            dbName = dbName,
            tblName = tblName,
            fieldName = columnName,
            fieldType = columnType
          )
        )
      )
    )
    queryExecutor
      .executeQuery(orgId, query, Array.empty, false)
      .map(table => {
        val records: Array[Array[Object]] = table.records
        if (records.nonEmpty && records.head.nonEmpty) {
          records.head.headOption.map(_.toString).getOrElse("")
        } else {
          ""
        }
      })
  }
}

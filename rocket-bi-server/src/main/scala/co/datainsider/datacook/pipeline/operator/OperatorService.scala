package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.chart.{ChartSetting, PivotTableSetting, TableColumn}
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.service.QueryExecutor
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.util.StringUtils
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.requests.TableFromQueryInfo
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema, TableType}
import co.datainsider.schema.misc.{ClickHouseUtils, ColumnDetector}
import co.datainsider.schema.service.{IngestionService, SchemaService}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, VALUE_NULL, async}
import datainsider.client.exception.{DbNotFoundError, InternalError}

import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 4:30 PM
  */

class OperatorService(
    schemaService: SchemaService,
    queryExecutor: QueryExecutor,
    ingestionService: IngestionService,
    dbPrefix: String,
    querySize: Int = 1000,
    batchSize: Int = 100000,
    maxRetryTimes: Int = 10,
    sleepInterval: Int = 500
) extends Logging {

  private val DB_DISPLAY_NAME = "ETL Database"

  private val clazz: String = getClass.getSimpleName

  def getSchemaService(): SchemaService = schemaService

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
        case _ => schemaService.createTableSchema(tableSchema)
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
        val totalRow: Long = ingestionService.getTotalRow(orgId, dbName, tblName).syncGet()
        isRunning = totalRow < nInsertedRow && retryTime < maxRetryTimes
        if (isRunning) {
          retryTime += 1
          Thread.sleep(sleepInterval)
        }
      } while (isRunning)
      logger.info(s"waitUntilIngestCompleted:: ${dbName}.${tblName} completed")
    }

  /**
    * insert data from query
    */
  def ingest(tableSchema: TableSchema, query: ChartSetting): Future[Unit] =
    async {
      Profiler(s"[${clazz}]::ingest") {
        val organizationId: Long = tableSchema.organizationId
        val dbName: String = tableSchema.dbName
        val tblName: String = tableSchema.name
        try {
          logger.info(s"ingest::start table ${dbName}.${tblName}")
          val insertedRows: Long =
            loadBatchData(organizationId, dbName, tblName, query, batchSize)((records: Seq[Array[Any]]) => {
              ingestionService.ingest(tableSchema, records = records)
            })
          waitIngestCompleted(organizationId, dbName, tblName, insertedRows)
          logger.info(s"ingest::end ${dbName}.${tblName}, inserted rows ${insertedRows}")
        } catch {
          case ex: Throwable =>
            logger.error(s"insertData:: orgId: $organizationId, dbName: $dbName, tblName: $tblName", ex)
            throw InternalError(s"Insert data into table ${dbName}.${tblName} failure, cause: ${ex.getMessage}", ex)
        }
      }
    }

  private def loadBatchData(
      organizationId: Long,
      dbName: String,
      tblName: String,
      query: ChartSetting,
      batchSize: Int
  )(ingestFn: (Seq[Array[Any]]) => Future[Int]): Long = {
    var offset = 0
    var isRunning = true;
    var records = ArrayBuffer[Array[Any]]()
    var nInsertedRow = 0
    do {
      val dataTable: DataTable = executeQuery(organizationId, query, Some(Limit(offset, querySize))).syncGet()
      records.appendAll(dataTable.records.toSeq.asInstanceOf[Seq[Array[Any]]])
      logger.info(s"write data to ${dbName}.${tblName}, records size:: ${records.length}")
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
  def ingestIfTableEmpty(tableSchema: TableSchema, query: ChartSetting): Future[Unit] =
    Profiler(s"[${clazz}]::ingestIfTableEmpty") {
      ingestionService.isEmpty(tableSchema.organizationId, tableSchema.dbName, tableSchema.name).flatMap {
        case true => ingest(tableSchema, query)
        case _    => Future.Unit
      }
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
}

object OperatorService extends Logging {

  // get db name by id
  @deprecated("use getDbName in implement of EtlTableService instead")
  def getDbName(organizationId: OrganizationId, id: EtlJobId, prefix: String = "etl"): String = {
    val rawDbName: String = s"${prefix}_${id}"
    ClickHouseUtils.buildDatabaseName(organizationId, rawDbName)
  }

  /**
    * Create Column from TableColumn & Value:
    *
    * - nếu cột là group + scalar là date => date column
    *
    * - Lấy datatype từ data frame để tạo column
    *
    * - Nếu column không thể tạo được từ 2 bước trên, tự động lấy data từ value
    *
    * => Default: StringColumn
    */
  def detectColumn(dataTable: DataTable, tableColumn: Option[TableColumn], colIndex: Int): Column = {
    val columnName: String = StringUtils.normalizeName(dataTable.headers(colIndex))
    val displayName: String = tableColumn.map(_.name).getOrElse(columnName)

    val column: Option[Column] = tableColumn match {
      case Some(column) =>
        column.function match {
          case function: GroupBy if (function.scalarFunction.isDefined) =>
            toDateHistogramColumn(columnName, displayName, function.scalarFunction.get)
          case _ => detectColumnByColumnType(columnName, displayName, dataTable.colTypes(colIndex))
        }
      case _ => None
    }

    column.getOrElse(detectColumnByValue(dataTable, columnName, displayName, colIndex))
  }

  private def toDateHistogramColumn(
      columnName: String,
      displayName: String,
      scalarFunction: ScalarFunction
  ): Option[Column] =
    Option {
      scalarFunction match {
        case _: ToSecondNum  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToMinuteNum  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToHourNum    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayNum     => DateColumn(columnName, displayName, isNullable = true)
        case _: ToWeekNum    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToMonthNum   => StringColumn(columnName, displayName, isNullable = true)
        case _: ToQuarterNum => StringColumn(columnName, displayName, isNullable = true)
        case _: ToYearNum    => Int64Column(columnName, displayName, isNullable = true)

        case _: ToSecond     => Int16Column(columnName, displayName, isNullable = true)
        case _: ToMinute     => Int16Column(columnName, displayName, isNullable = true)
        case _: ToHour       => Int8Column(columnName, displayName, isNullable = true)
        case _: ToMonth      => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayOfWeek  => StringColumn(columnName, displayName, isNullable = true)
        case _: ToDayOfMonth => Int64Column(columnName, displayName, isNullable = true)
        case _: ToDayOfYear  => Int32Column(columnName, displayName, isNullable = true)
        case _: ToQuarter    => StringColumn(columnName, displayName, isNullable = true)
        case _: ToYear       => Int32Column(columnName, displayName, isNullable = true)
        case _               => null
      }
    }

  /**
    * detect column from data frame and table columns columns
    *
    * @return
    */
  private def detectTransformColumns(tableColumns: Array[TableColumn], dataTable: DataTable): Seq[Column] = {
    val headerSize: Int = dataTable.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val column: Option[TableColumn] = tableColumns.lift(colIndex)
      detectColumn(dataTable, column, colIndex)
    }
  }

  /**
    * detect pivot correct,
    * nếu là cột thêm thì sẽ tự động kiểu dữ liệu là number,
    * còn nếu là cột bình thường, thì kiểu dữ liệu được detect
    */
  private def detectPivotColumns(setting: PivotTableSetting, dataFrame: DataTable) = {
    val columns: Array[TableColumn] = setting.rows.map(_.copy(isCalcGroupTotal = false))

    val headerSize: Int = dataFrame.headers.length - 1
    for (colIndex <- 0 to headerSize) yield {
      val isFixedColumnType = colIndex < columns.length
      if (isFixedColumnType) {
        detectColumn(dataFrame, columns.lift(colIndex), colIndex)
      } else {
        val columnName: String = StringUtils.normalizeName(dataFrame.headers(colIndex))
        val displayName: String = columns.lift(colIndex).map(_.name).getOrElse(columnName)
        DoubleColumn(columnName, displayName, None, defaultValue = None, isNullable = true)
      }
    }
  }

  /**
    * detect column from data frame and table columns columns
    * @return
    */
  def detectColumns(querySetting: ChartSetting, dataFrame: DataTable): Seq[Column] = {
    querySetting match {
      case pivotSetting: PivotTableSetting => detectPivotColumns(pivotSetting, dataFrame)
      case _ => {
        val tableColumns = querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
        detectTransformColumns(tableColumns, dataFrame)
      }
    }
  }

  /**
    * Detect basic type from column type
    */
  private def detectColumnByColumnType(name: String, displayName: String, columnType: String): Option[Column] =
    Option {
      columnType match {
        case _ if columnType.contains("Array")      => null
        case _ if (columnType.contains("Nested"))   => null
        case _ if columnType.contains("UInt")       => Int64Column(name, displayName, isNullable = true)
        case _ if columnType.contains("Int")        => Int64Column(name, displayName, isNullable = true)
        case "Float32" | "Nullable(Float32)"        => FloatColumn(name, displayName, isNullable = true)
        case "Float64" | "Nullable(Float64)"        => DoubleColumn(name, displayName, isNullable = true)
        case "String" | "Nullable(String)"          => StringColumn(name, displayName, Some(""), isNullable = true)
        case _ if columnType.contains("DateTime64") => DateTimeColumn(name, displayName, isNullable = true)
        case _ if columnType.contains("DateTime")   => DateTimeColumn(name, displayName, isNullable = true)
        case _                                      => null
      }
    }

  private def detectColumnByValue(
      dataFrame: DataTable,
      columnName: String,
      displayName: String,
      colIndex: Int
  ): Column = {
    val value: Any = findNotNullValue(dataFrame.records, colIndex).getOrElse("")
    info(s"findValueNotNull for column name: ${columnName} - value: ${value} type: ${value.getClass.getSimpleName}")
    ColumnDetector.detectColumnByValue(columnName, displayName, value)
  }

  /**
    * Find value of data frame not null
    */
  private def findNotNullValue(data: Array[Array[Object]], colIndex: Int): Option[Any] = {
    data
      .find(data => {
        val value: Any = data.lift(colIndex).orNull
        value != null && VALUE_NULL != value && value != ""
      })
      .map(data => data(colIndex))
  }
}

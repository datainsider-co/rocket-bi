package datainsider.data_cook.service.table

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.engine.clickhouse.DataFrame
import datainsider.client.domain.query._
import datainsider.client.exception.{DbNotFoundError, InternalError}
import datainsider.client.service.QueryExecutor
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.service.table.EtlTableService.DEFAULT_DB_NAME
import datainsider.ingestion.domain.TableType.{InMemory, TableType}
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.ingestion.domain.{Column, DatabaseSchema, TableSchema, TableType}
import datainsider.ingestion.service.{IngestionService, SchemaService}
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.profiler.Profiler

import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 4:30 PM
  */

class EtlTableServiceImpl(
    parser: QueryParser,
    schemaService: SchemaService,
    ingestionService: IngestionService,
    queryExecutor: QueryExecutor,
    dbPrefix: String,
    tableType: TableType
) extends EtlTableService
    with Logging {
  private val querySize = ZConfig.getInt("data_cook.query_size", 9000)
  private val insertBatchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)
  private val maxRetryTimes: Int = ZConfig.getInt("cluster_ddl.max_retry_times", 100)
  private val waitTimeMs: Int = ZConfig.getInt("cluster_ddl.wait_time_ms", 250)

  /**
    * Create view from query
    *
    * @param id              etl id
    * @param query           for create view
    * @param destTableConfig config for destination, use generate default if none
    * @return
    */
  override def creatView(
      organizationId: OrganizationId,
      id: EtlJobId,
      query: Query,
      destTableConfig: TableConfiguration,
      tableType: TableType = TableType.EtlView,
      aliasColumnDisplayNames: Array[String] = Array.empty
  ): Future[TableSchema] =
    Profiler("[EtlTableService]::creatView") {
      val queryAsString: String = parser.parse(query)
      info(s"creatView:: ${queryAsString}")
      val dbName: String = getDbName(organizationId, id)
      for {
        _ <- ensureDatabaseCreated(organizationId, dbName)
        schema <- schemaService.createTableSchema(
          organizationId,
          EtlTableService
            .buildTableFromQueryInfo(dbName, queryAsString, destTableConfig, tableType, aliasColumnDisplayNames)
        )
      } yield schema
    }

  private def ensureDatabaseCreated(organizationId: OrganizationId, dbName: String): Future[Unit] = {
    for {
      isDDLExists <- schemaService.isDatabaseExists(organizationId, dbName, useDdlQuery = true)
      isStorageExists <- schemaService.isDatabaseExists(organizationId, dbName)
      result <- (isStorageExists, isDDLExists) match {
        case (true, true) => Future.Unit
        case _ => schemaService.addDatabase(buildDatabaseSchema(organizationId, dbName))
      }
    } yield result
  }

  private def buildDatabaseSchema(organizationId: OrganizationId, dbName: String): DatabaseSchema = {
    DatabaseSchema(
      name = dbName,
      organizationId = organizationId,
      displayName = DEFAULT_DB_NAME,
      createdTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      tables = Seq.empty
    )
  }

  override def dropEtlDatabase(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    schemaService.deleteDatabase(organizationId, dbName)
  }

  private def queryData(querySetting: QuerySetting, limit: Option[Limit] = None): DataFrame = {
    val objectQuery: Query = querySetting.toQuery.setLimit(limit)
    val tableColumns: Array[TableColumn] = querySetting.toTableColumns.map(_.copy(isCalcGroupTotal = false))
    logger.info(s"queryData::limit ${limit}")
    logger.info(s"queryData::query ${parser.parse(objectQuery)}")
    val result = queryExecutor.executeQuery(objectQuery, tableColumns)
    logger.info(s"queryData::result header: ${result.headers.length}, rows: ${result.records.length}")
    result
  }

  private def detectTableSchema(
      organizationId: OrganizationId,
      id: EtlJobId,
      querySetting: QuerySetting,
      destTableConfig: TableConfiguration
  ): Future[TableSchema] =
    Future {
      val dataFrame: DataFrame = queryData(querySetting, Some(Limit(0, 20)))
      val columns: Seq[Column] = EtlTableService.detectColumns(querySetting, dataFrame)
      TableSchema(
        name = destTableConfig.tblName,
        dbName = getDbName(organizationId, id),
        organizationId = organizationId,
        displayName = destTableConfig.tblDisplayName,
        columns = columns,
        tableType = Some(tableType)
      )
    }

  /**
    * create table from query
    */
  override def createTable(
      organizationId: OrganizationId,
      id: EtlJobId,
      querySetting: QuerySetting,
      destTableConfig: TableConfiguration
  ): Future[TableSchema] =
    Profiler("[EtlTableService]::createTable") {
      for {
        tableSchema: TableSchema <- detectTableSchema(organizationId, id, querySetting, destTableConfig)
        finalSchema: TableSchema <- schemaService.createTableSchemaIfNotExists(tableSchema)
      } yield finalSchema
    }

  def canGetNext(data: DataFrame, itemSize: Int): Boolean = data.records.nonEmpty && itemSize <= data.records.length

  /**
    * Wait Table insert completed, if n time retry greater than max retry then function will end
    */
  private def waitUntilIngestCompleted(dbName: DBName, tblName: TblName, nInsertedRow: Long): Unit =
    Profiler("[EtlTableService]::waitUntilIngestCompleted") {
      var isRunning = false
      var nRetry = 0
      do {
        val totalRow: Long = ingestionService.getTotalRow(dbName, tblName).syncGet()
        isRunning = totalRow < nInsertedRow && nRetry < maxRetryTimes
        if (isRunning) {
          info(s"waitUntilIngestCompleted:: ${dbName}.${tblName} nRetry: ${nRetry}")
          nRetry += 1
          Thread.sleep(waitTimeMs)
        }
      } while (isRunning)
      info(s"waitUntilIngestCompleted:: ${dbName}.${tblName} completed")
    }

  /**
    * insert data from query
    */
  override def ingest(
      organizationId: OrganizationId,
      dbName: DBName,
      tblName: TblName,
      query: QuerySetting
  ): Future[Unit] =
    Future {
      Profiler("[EtlTableService]::ingest") {
        try {
          info(s"ingest::start organizationId::${organizationId}, dbName: ${dbName}, tblName: ${tblName}")
          val nInsertedRow = loadDataAndIngest(organizationId, dbName, tblName, query, insertBatchSize)((records) => {
            ingestionService.ingestArrayRecords(dbName = dbName, tblName = tblName, records = records)
          })
          waitUntilIngestCompleted(dbName, tblName, nInsertedRow)
          info(s"ingest::end organizationId::${organizationId}, dbName: ${dbName}, tblName: ${tblName}")
        } catch {
          case ex: Throwable =>
            error(s"insertData:: orgId: $organizationId, dbName: $dbName, tblName: $tblName", ex)
            throw InternalError(s"Insert data into table ${dbName}.${tblName} failure, cause: ${ex.getMessage}", ex)
        }
      }
    }

  private def loadDataAndIngest(
      organizationId: OrganizationId,
      dbName: DBName,
      tblName: TblName,
      query: QuerySetting,
      batchSize: Int
  )(ingestFn: (Array[Array[Object]]) => Future[Int]): Long = {
    var offset = 0
    var isRunning = true;
    var recordsBuffer = ArrayBuffer[Array[Object]]()
    var nInsertedRow = 0
    info(s"loadDataAndIngest::run ${dbName}.${tblName}")
    do {
      val data: DataFrame = queryData(query, Some(Limit(offset, querySize)))
      recordsBuffer.appendAll(data.records)
      info(
        s"loadDataAndIngest::size ${dbName}.${tblName} ${recordsBuffer.length} - data:: ${data.records.length} ${offset} ${querySize}"
      )
      offset += querySize
      isRunning = canGetNext(data, querySize)
      // run
      if (recordsBuffer.size >= batchSize) {
        info(s"loadDataAndIngest::executeBatch ${dbName}.${tblName} ${recordsBuffer.size}")
        nInsertedRow = ingestFn(recordsBuffer.toArray).syncGet()
        recordsBuffer = ArrayBuffer()
      }
    } while (isRunning)

    // empty
    if (recordsBuffer.nonEmpty) {
      info(s"loadDataAndIngest::executeBatch ${dbName}.${tblName} ${recordsBuffer.size}")
      nInsertedRow = ingestFn(recordsBuffer.toArray).syncGet()
    }
    nInsertedRow
  }

  /**
    * Insert data from query to table if table is empty
    */
  override def ingestIfTableEmpty(
      organizationId: OrganizationId,
      dbName: DBName,
      tblName: TblName,
      query: QuerySetting
  ): Future[Unit] =
    Profiler("[EtlTableService]::ingestIfTableEmpty") {
      ingestionService.isEmpty(dbName, tblName).flatMap {
        case true => ingest(organizationId, dbName, tblName, query)
        case _    => Future.Unit
      }
    }

  private def renameToTemporaryTables(
      organizationId: OrganizationId,
      dbName: DBName,
      tables: Array[TableSchema]
  ): Future[Seq[Boolean]] = {
    val results = tables.map(table => {
      schemaService.renameTableSchema(
        organizationId = organizationId,
        dbName = dbName,
        tblName = table.name,
        newTblName = TableSchema.buildOldTblName(table.name)
      )
    })
    Future.collect(results)
  }

  private def removeInMemoryTables(
      organizationId: OrganizationId,
      dbName: DBName,
      inMemoryTables: Array[TableSchema]
  ): Future[Seq[Boolean]] = {
    val results = inMemoryTables.map(table => {
      schemaService.deleteTableSchema(organizationId, dbName, tblName = table.name)
    })
    Future.collect(results)
  }

  /**
    * Remove table,type is default will rename as temporary, in memory will hard delete
    */
  def removeTables(organizationId: OrganizationId, dbName: DBName, tables: Array[TableSchema]): Future[Seq[Boolean]] = {
    val inMemoryTables: Array[TableSchema] = tables.filter(_.getTableType == InMemory)
    val defaultTables: Array[TableSchema] = tables.diff(inMemoryTables)

    Future
      .collect(
        Seq(
          renameToTemporaryTables(organizationId, dbName, defaultTables),
          removeInMemoryTables(organizationId, dbName, inMemoryTables)
        )
      )
      .map(_.flatten)
  }

  override def removeTables(organizationId: OrganizationId, id: EtlJobId, tblNames: Array[TblName]): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    val result: Future[Boolean] = for {
      database <- fetchDatabase(organizationId, dbName)
      tableExists = database.findTables(tblNames)
      result <- removeTables(organizationId, dbName, tableExists)
    } yield result.forall(isOK => isOK)
    result.rescue {
      case ex: Throwable =>
        error(s"removeTables:: orgId: $organizationId, dbName: $dbName, tables: ${tblNames.mkString(",")}", ex)
        Future.False
    }
  }

  override def removeAllTables(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    val dbName: String = getDbName(organizationId, id)
    val result: Future[Boolean] = for {
      database <- fetchDatabase(organizationId, dbName)
      result <- removeTables(organizationId, dbName, database.tables.toArray)
    } yield result.forall(isOk => isOk)
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

  override def getDbName(organizationId: OrganizationId, id: EtlJobId): String = {
    val rawDbName = s"${dbPrefix}_${id}"
    ClickHouseUtils.buildDatabaseName(organizationId, rawDbName)
  }
}

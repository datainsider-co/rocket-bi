package datainsider.ingestion.service

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.lakehouse.LakeColumn
import datainsider.client.exception.DbNotFoundError
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.ingestion.controller.http.requests.{ClearTableRequest, EnsureSparkSchemaRequest, IngestFakeDataRequest, IngestRequest}
import datainsider.ingestion.controller.http.responses.IngestResponse
import datainsider.ingestion.domain.{BoolColumn, Column, DateColumn, DateTime64Column, DoubleColumn, FloatColumn, Int32Column, Int64Column, SparkColumn, SparkDataType, SparkWriteMode, StringColumn, TableSchema}
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.ingestion.misc.ColumnDetector
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.misc.parser.{ClickHouseDataParser, DataParser}
import datainsider.ingestion.repository.DataRepository
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.Implicits.ImplicitString
import datainsider.ingestion.domain.SparkDataType._
import datainsider.ingestion.domain.SparkWriteMode.SparkWriteMode

import javax.inject.Inject

/**
  * @author andy
  * @since 7/21/20
  */
trait IngestionService {
  def ingest(request: IngestRequest): Future[IngestResponse]

  def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean]

  def ingest(schema: TableSchema, records: Seq[Record]): Future[Int]

  def ingest(dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse]

  def ingestArrayRecords(dbName: String, tblName: String, records: Array[Array[Object]]): Future[Int]

  def ingest(request: IngestFakeDataRequest): Future[IngestResponse]

  def clearTable(request: ClearTableRequest): Future[Boolean]

  /*
   * Get Total Row of table
   */
  def getTotalRow(dbName: DBName, tblName: TblName): Future[Long]

  /**
    * Check table is empty or has data
    */
  def isEmpty(dbName: DBName, tblName: TblName): Future[Boolean]
}

case class IngestionServiceImpl @Inject() (
    schemaService: SchemaService,
    dataRepository: DataRepository
) extends IngestionService
    with Logging {

  override def ingest(request: IngestRequest): Future[IngestResponse] = {
    for {
      _ <- mergeSchema(request)
      tableSchema <- schemaService.getTableSchema(
        request.organizationId,
        request.dbName,
        request.tblName
      )
      parseResult = ClickHouseDataParser(tableSchema).parseRecords(request.records)
      totalInsertedRecords <- ingest(tableSchema, parseResult.records)
    } yield buildIngestResponse(parseResult, totalInsertedRecords)
  }

  override def ingest(schema: TableSchema, records: Seq[Record]): Future[Int] = {
    dataRepository.writeRecords(schema, records, 1000)
  }

  private def buildIngestResponse(result: DataParser.Result, totalInsertedRecords: Long) = {
    IngestResponse(
      totalRecords = result.totalRecords,
      totalInvalidRecords = result.totalInvalidRecords,
      totalInvalidFields = result.totalInvalidFields,
      totalSkippedRecords = result.totalSkippedRecords,
      totalInsertedRecords = totalInsertedRecords,
      totalFailedRecords = result.records.size - totalInsertedRecords
    )
  }

  private def mergeSchema(request: IngestRequest): Future[Unit] = {
    for {
      _ <- schemaService.ensureDatabaseCreated(request.organizationId, request.dbName)
      _ <- schemaService.isDatabaseExists(request.organizationId, request.dbName).flatMap {
        case true => schemaService.createOrMergeTableSchema(buildTableSchema(request))
        case _    => Future.exception(DbNotFoundError(s"The database is not found: ${request.dbName}"))
      }
    } yield {}
  }

  private def buildTableSchema(request: IngestRequest): TableSchema = {
    val properties = request.getAsOneRecord()
    val columns = ColumnDetector.detectColumns(properties)
    TableSchema(
      name = request.tblName,
      dbName = request.dbName,
      organizationId = request.organizationId,
      displayName = request.tblName.asPrettyDisplayName,
      columns = columns
    )
  }

  override def ingest(dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse] = {
    for {
      tableSchema <- schemaService.getTableSchema(dbName, tblName)
      parseResult = ClickHouseDataParser(tableSchema).parseCSVRecords(records)
      totalInsertedRecords <- ingest(tableSchema, parseResult.records)
    } yield buildIngestResponse(parseResult, totalInsertedRecords)
  }

  override def ingestArrayRecords(
      dbName: String,
      tblName: String,
      records: Array[Array[Object]]
  ): Future[Int] = {
    val batchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)

    for {
      tableSchema <- schemaService.getTableSchema(dbName, tblName)
      response <- dataRepository.writeRecords(tableSchema, records, batchSize)
    } yield response
  }

  override def clearTable(request: ClearTableRequest): Future[Boolean] = {
    schemaService.isTableExists(request.organizationId, request.getDatabaseName(), request.tblName).flatMap {
      case true  => dataRepository.clearTable(request.getDatabaseName(), request.tblName)
      case false => Future.True
    }
  }

  override def ingest(request: IngestFakeDataRequest): Future[IngestResponse] = {
    val batchSize = 1000
    val total = request.length
    val times = (total / batchSize).toInt
    val rest = (total % batchSize).toInt
    val batches = if (rest == 0) Array.fill(times)(batchSize) else Array.fill(times)(batchSize) :+ rest
//    batches.foldLeft(IngestResponse(0, 0, 0, 0, 0, 0))((z, size) => {
//      val data = FakeDataGenerator.generate(size, request.tableCols)
//      val b = Await.result(ingest(request.dbName, request.tblName, data))
//      z += b
//    })

    batches.foldLeft[Future[IngestResponse]](Future.value(IngestResponse(0, 0, 0, 0, 0, 0)))((r, size) => {
      val data = FakeDataGenerator.generate(size, request.tableCols)
      r.flatMap(r => ingest(request.dbName, request.tblName, data).map(r2 => r += r2))
    })
  }

  override def getTotalRow(dbName: DBName, tblName: TblName): Future[Long] =
    dataRepository.getTotalRow(dbName, tblName)

  /**
    * Check table is empty or has data
    */
  override def isEmpty(dbName: DBName, tblName: TblName): Future[Boolean] =
    getTotalRow(dbName, tblName).map(totalRow => totalRow == 0)

  override def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean] = {
    for {
      _ <- schemaService.ensureDatabaseCreated(request.organizationId, request.dbName)
      _ <- request.writeMode match {
        case SparkWriteMode.Append => Future.True
        case SparkWriteMode.Overwrite =>
          schemaService.deleteTableSchema(request.organizationId, request.dbName, request.tblName)
      }
      _ <- schemaService.isDatabaseExists(request.organizationId, request.dbName).flatMap {
        case true => schemaService.createOrMergeTableSchema(request.toTableSchema())
        case _    => Future.exception(DbNotFoundError(s"The database is not found: ${request.dbName}"))
      }
      isOk <- schemaService.isTableExists(request.organizationId, request.dbName, request.tblName)
    } yield isOk
  }
}

case class MockIngestionServiceImpl @Inject() () extends IngestionService {

  override def ingest(request: IngestRequest): Future[IngestResponse] = {
    val response = IngestResponse(
      totalRecords = request.records.length,
      totalInvalidRecords = 0,
      totalInvalidFields = 0,
      totalSkippedRecords = 0,
      totalInsertedRecords = request.records.length,
      totalFailedRecords = 0
    )
    Future.value(response)
  }

  override def ingest(schema: TableSchema, records: Seq[Record]): Future[Int] = {
    Future.value(1)
  }

  override def clearTable(request: ClearTableRequest): Future[Boolean] = {
    Future.True
  }

  override def ingest(dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse] = {
    val response = IngestResponse(
      totalRecords = records.length,
      totalInvalidRecords = 0,
      totalInvalidFields = 0,
      totalSkippedRecords = 0,
      totalInsertedRecords = records.length,
      totalFailedRecords = 0
    )
    Future.value(response)
  }

  override def ingest(request: IngestFakeDataRequest): Future[IngestResponse] = {
    val response = IngestResponse(
      totalRecords = 0,
      totalInvalidRecords = 0,
      totalInvalidFields = 0,
      totalSkippedRecords = 0,
      totalInsertedRecords = 0,
      totalFailedRecords = 0
    )
    Future.value(response)
  }

  override def ingestArrayRecords(
      dbName: String,
      tblName: String,
      records: Array[Array[Object]]
  ): Future[Int] =
    Future.value(1)

  override def getTotalRow(dbName: DBName, tblName: TblName): Future[Long] = Future.value(1)

  /**
    * Check table is empty or has data
    */
  override def isEmpty(dbName: DBName, tblName: TblName): Future[Boolean] = Future.False

  override def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean] = Future.True
}

package co.datainsider.schema.service

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.service.EngineService
import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.common.client.exception.DbNotFoundError
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.requests.{ClearTableRequest, EnsureSparkSchemaRequest, IngestRequest}
import co.datainsider.schema.domain.responses.IngestResponse
import co.datainsider.schema.domain.{SparkWriteMode, TableSchema}
import co.datainsider.schema.misc.ColumnDetector
import co.datainsider.schema.misc.parser.{ClickHouseDataParser, DataParser}
import com.twitter.inject.Logging
import com.twitter.util.Future

import javax.inject.Inject

/**
  * @author andy
  * @since 7/21/20
  */
trait IngestionService {
  @deprecated("unsupported method use ingest with records instead")
  def ingest(request: IngestRequest): Future[IngestResponse]

  def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean]

  def ingest(schema: TableSchema, records: Seq[Record]): Future[Int]

  def ingest(orgId: Long, dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse]

  def clearTable(request: ClearTableRequest): Future[Boolean]
}

case class IngestionServiceImpl(
    schemaService: SchemaClientService,
    engineService: EngineService,
    batchSize: Int = 1000
) extends IngestionService
    with Logging {

  override def ingest(request: IngestRequest): Future[IngestResponse] = {
    for {
      _ <- mergeSchema(request)
      tableSchema <- schemaService.getTable(
        request.organizationId,
        request.dbName,
        request.tblName
      )
      parseResult: DataParser.Result = ClickHouseDataParser(tableSchema).parseRecords(request.records)
      totalInsertedRecords <- ingest(tableSchema, parseResult.records)
    } yield buildIngestResponse(parseResult, totalInsertedRecords)
  }

  override def ingest(schema: TableSchema, records: Seq[Record]): Future[Int] = {
    for {
      engine <- engineService.get(schema.organizationId)
      insertedRows <- engine.write(schema, records)
    } yield insertedRows
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
      _ <- schemaService.ensureDatabaseCreated(request.organizationId, request.dbName, None)
      _ <- schemaService.isDbExists(request.organizationId, request.dbName, useDdlQuery = true).flatMap {
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

  override def ingest(orgId: Long, dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse] = {
    for {
      tableSchema <- schemaService.getTable(orgId, dbName, tblName)
      parseResult = ClickHouseDataParser(tableSchema).parseCSVRecords(records)
      totalInsertedRecords <- ingest(tableSchema, parseResult.records)
    } yield buildIngestResponse(parseResult, totalInsertedRecords)
  }

  override def clearTable(request: ClearTableRequest): Future[Boolean] = {
    for {
      isExisted <- schemaService.isTblExists(request.organizationId, request.getDatabaseName(), request.tblName, Seq.empty)
      engine <- engineService.get(request.organizationId)
      result <- isExisted match {
        case true  => engine.getDDLExecutor().truncate(request.getDatabaseName(), request.tblName)
        case false => Future.True
      }
    } yield result
  }

  override def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean] = {
    for {
      _ <- schemaService.ensureDatabaseCreated(request.organizationId, request.dbName, None)
      _ <- request.writeMode match {
        case SparkWriteMode.Append => Future.True
        case SparkWriteMode.Overwrite =>
          schemaService.deleteTableSchema(request.organizationId, request.dbName, request.tblName)
      }
      _ <- schemaService.isDbExists(request.organizationId, request.dbName, true).flatMap {
        case true => schemaService.createOrMergeTableSchema(request.toTableSchema())
        case _    => Future.exception(DbNotFoundError(s"The database is not found: ${request.dbName}"))
      }
      isOk <- schemaService.isTblExists(request.organizationId, request.dbName, request.tblName, Seq.empty)
    } yield isOk
  }
}

case class MockIngestionService @Inject() () extends IngestionService {

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

  override def ingest(orgId: Long, dbName: String, tblName: String, records: Seq[Record]): Future[IngestResponse] = {
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

  override def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean] = Future.True
}

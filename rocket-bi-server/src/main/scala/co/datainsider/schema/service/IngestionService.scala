package co.datainsider.schema.service

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.schema.domain.requests.{ClearTableRequest, EnsureSparkSchemaRequest, IngestRequest}
import co.datainsider.schema.domain.responses.IngestResponse
import co.datainsider.schema.domain.{SparkWriteMode, TableSchema}
import co.datainsider.schema.misc.ColumnDetector
import co.datainsider.schema.misc.parser.{ClickHouseDataParser, DataParser}
import co.datainsider.schema.repository.DataRepository
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.DbNotFoundError

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

  def clearTable(request: ClearTableRequest): Future[Boolean]

  /*
   * Get Total Row of table
   */
  def getTotalRow(orgId: Long, dbName: String, tblName: String): Future[Long]

  /**
    * Check table is empty or has data
    */
  def isEmpty(orgId: Long, dbName: String, tblName: String): Future[Boolean]
}

case class IngestionServiceImpl(
    schemaService: SchemaService,
    connectionService: ConnectionService,
    engineResolver: EngineResolver,
    batchSize: Int = 1000
) extends IngestionService
    with Logging {

  private def getDataRepository(orgId: Long): Future[DataRepository] = {
    connectionService
      .getTunnelConnection(orgId)
      .map(source => {
        val dataSource: Engine[Connection] = engineResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
        dataSource.getDataRepository(source)
      })
  }

  override def ingest(request: IngestRequest): Future[IngestResponse] = {
    for {
      _ <- mergeSchema(request)
      tableSchema <- schemaService.getTableSchema(
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
      connection <- connectionService.getTunnelConnection(schema.organizationId)
      engine = engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
      insertedRows <- engine.write(connection, schema, records)
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

  override def clearTable(request: ClearTableRequest): Future[Boolean] = {
    for {
      dataRepository <- getDataRepository(request.organizationId)
      isExisted <- schemaService.isTableExists(request.organizationId, request.getDatabaseName(), request.tblName)
      result <- isExisted match {
        case true  => dataRepository.clearTable(request.getDatabaseName(), request.tblName)
        case false => Future.True
      }
    } yield result
  }

  override def getTotalRow(orgId: Long, dbName: String, tblName: String): Future[Long] = {
    for {
      dataRepository <- getDataRepository(orgId)
      totalRow <- dataRepository.getTotalRow(dbName, tblName)
    } yield totalRow
  }

  /**
    * Check table is empty or has data
    */
  override def isEmpty(orgId: Long, dbName: String, tblName: String): Future[Boolean] =
    getTotalRow(orgId, dbName, tblName).map(totalRow => totalRow == 0)

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

  override def getTotalRow(orgId: Long, dbName: String, tblName: String): Future[Long] = Future.value(1)

  /**
    * Check table is empty or has data
    */
  override def isEmpty(orgId: Long, dbName: String, tblName: String): Future[Boolean] = Future.False

  override def ensureSchema(request: EnsureSparkSchemaRequest): Future[Boolean] = Future.True
}

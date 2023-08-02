package co.datainsider.schema.service

import co.datainsider.schema.domain.{
  CsvSchemaResponse,
  CsvUploadResponse,
  DetectCsvSchemaRequest,
  IngestCsvRequest,
  RegisterCsvSchemaRequest,
  TableSchema
}
import co.datainsider.schema.misc.ClickHouseUtils
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future

trait CsvIngestionService {

  /** *
    * luu thong tin cua file xuong db:
    *  - neu chua ton tai: create
    *  - neu da ton tai: update
    * also ensure schema tuong ung da dc tao, ready de upload data
    * @return
    */
  def registerSchema(request: RegisterCsvSchemaRequest): Future[TableSchema]

  /** *
    * get sample csv de detect default csv setting + config cua user
    * detect schema can insert
    * convert ve dung kieu du lieu
    * tra preview records ve client
    * @return
    */
  def detectSchema(request: DetectCsvSchemaRequest): Future[CsvSchemaResponse]

  /** *
    * insert batch nay vao destination source
    * report back to client
    * @return
    */
  def ingestCsv(request: IngestCsvRequest): Future[CsvUploadResponse]
}

class CsvIngestionServiceImpl @Inject() (
    schemaService: SchemaService,
    ingestionService: IngestionService
) extends CsvIngestionService
    with Logging {
  override def registerSchema(request: RegisterCsvSchemaRequest): Future[TableSchema] = {
    val orgId: Long = request.currentOrganizationId.get
    val normalizedSchema: TableSchema = normalizeSchema(request.schema)
    for {
      _ <- schemaService.ensureDatabaseCreated(orgId, request.schema.dbName)
      tableSchema <-
        schemaService
          .createOrMergeTableSchema(normalizedSchema.copy(organizationId = orgId))
          .map(_ => normalizedSchema)
    } yield tableSchema
  }

  override def detectSchema(req: DetectCsvSchemaRequest): Future[CsvSchemaResponse] = {
    val csvData: String = if (req.csvSetting.includeHeader) req.sample.lines.drop(1).mkString("\n") else req.sample
    for {
      schema <-
        if (req.schema.isDefined && req.schema.get.columns.nonEmpty) Future.value(req.schema.get)
        else CsvReader.detectSchema(req.sample, req.csvSetting)
      records <- CsvReader.parse(csvData, schema.columns, req.csvSetting)
    } yield {
      CsvSchemaResponse(schema, req.csvSetting, records)
    }
  }

  override def ingestCsv(request: IngestCsvRequest): Future[CsvUploadResponse] = {
    val orgId: Long = request.currentOrganizationId.get
    for {
      schema <- schemaService.getTableSchema(orgId, request.dbName, request.tblName)
      records <- CsvReader.parse(request.data, schema.columns, request.csvSetting)
      rowsInserted <- ingestionService.ingest(schema, records)
    } yield {
      CsvUploadResponse(succeed = true, rowsInserted)
    }
  }

  /**
    * normalize table name & table column of table schema
    * @param schema schema to be normalized
    * @return
    */
  private def normalizeSchema(schema: TableSchema): TableSchema = {
    val normalizedTblName = ClickHouseUtils.normalizeString(schema.name)
    val normalizedColumns =
      schema.columns.map(c => c.copyTo(name = ClickHouseUtils.normalizeString(c.name), displayName = c.displayName))
    schema.copy(name = normalizedTblName, columns = normalizedColumns)
  }
}

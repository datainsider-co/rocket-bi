package datainsider.schema.service

import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.misc.JdbcClient.Record
import datainsider.schema.repository.CsvInfoRepository
import datainsider.schema.util.ClickHouseUtils

@deprecated("use CsvIngestionService")
trait OldCsvUploadService {

  /***
    * luu thong tin cua file xuong db:
    *  - neu chua ton tai: create
    *  - neu da ton tai: update
    * also ensure schema tuong ung da dc tao, ready de upload data
    * @return
    */
  def register(request: OldCsvRegisterRequest): Future[CsvUploadInfo]

  /***
    * get sample csv de detect default csv setting + config cua user
    * detect schema can insert
    * convert ve dung kieu du lieu
    * tra preview records ve client
    * @return
    */
  def preview(request: DetectCsvSchemaRequest): Future[CsvSchemaResponse]

  /***
    * insert batch nay vao destination source
    * report back to client
    * @return
    */
  def uploadBatch(request: OldCsvUploadRequest): Future[OldCsvUploadResponse]
}

class OldCsvUploadServiceImpl @Inject() (
    csvRepository: CsvInfoRepository,
    schemaService: SchemaService,
    ingestionService: IngestionService
) extends OldCsvUploadService
    with Logging {

  override def register(request: OldCsvRegisterRequest): Future[CsvUploadInfo] = {
    val orgId: Long = request.currentOrganizationId.get
    val normalizedSchema: TableSchema = normalizeSchema(orgId, request.schema)
    val csvInfo = CsvUploadInfo(
      id = request.fileName,
      batchSize = request.batchSize,
      csvSetting = request.csvSetting,
      schema = normalizedSchema,
      lastSuccessBatchNumber = 0,
      errorBatchNumbers = Seq.empty,
      isDone = false
    )
    for {
      ensureSchema <- ensureSchema(normalizedSchema)
      saveInfo <- csvRepository.put(csvInfo)
    } yield {
      if (saveInfo && ensureSchema) csvInfo
      else ???
    }
  }

  private def ensureSchema(schema: TableSchema): Future[Boolean] = {
    for {
      ensureTbl <- schemaService.createOrMergeTableSchema(schema).map(_ => true)
    } yield ensureTbl
  }

  /**
    * normalize table name & table column of table schema
    * @param schema schema to be normalized
    * @return
    */
  private def normalizeSchema(orgId: Long, schema: TableSchema): TableSchema = {
    val normalizedTblName = ClickHouseUtils.normalizeString(schema.name)
    val normalizedColumns =
      schema.columns.map(c => c.copyTo(name = ClickHouseUtils.normalizeString(c.name), displayName = c.displayName))
    schema.copy(organizationId = orgId, name = normalizedTblName, columns = normalizedColumns)
  }

  override def preview(req: DetectCsvSchemaRequest): Future[CsvSchemaResponse] = {
    val csvData: String = if (req.csvSetting.includeHeader) req.sample.lines.drop(1).mkString("\n") else req.sample
    for {
      schema <-
        if (req.schema.isDefined && req.schema.get.columns.nonEmpty) Future.value(req.schema.get)
        else CsvReader.detectSchema(req.sample, req.csvSetting)
      updatedSchema = processAdditionalInfo(schema, req.csvSetting)
      records <- CsvReader.parse(csvData, schema.columns, req.csvSetting)
    } yield {
      CsvSchemaResponse(updatedSchema, req.csvSetting, addBatchInfo(records, req.csvSetting, 0))
    }
  }

  private def processAdditionalInfo(
      schema: TableSchema,
      csvSetting: CsvSetting
  ): TableSchema = {
    if (csvSetting.addBatchInfo)
      schema.copy(columns = schema.columns :+ UInt32Column("_batch_id", "_batch_id", isNullable = true))
    else schema
  }

  override def uploadBatch(req: OldCsvUploadRequest): Future[OldCsvUploadResponse] = {
    for {
      csvInfo <- csvRepository.get(req.csvId).map {
        case Some(x) => x
        case None    => throw BadRequestError(s"not found csv info ${req.csvId}")
      }
      columns = if (csvInfo.csvSetting.addBatchInfo) csvInfo.schema.columns.dropRight(1) else csvInfo.schema.columns
      records <- CsvReader.parse(req.data, columns, csvInfo.csvSetting)
      rowsInserted <-
        ingestionService.ingest(csvInfo.schema, addBatchInfo(records, csvInfo.csvSetting, req.batchNumber))
      updateCsvInfo <- csvRepository.put(csvInfo.copy(lastSuccessBatchNumber = req.batchNumber, isDone = req.isEnd))
    } yield {
      logger.info(s"uploadBatch:: batchNumber: ${req.batchNumber}, records length ${records.length.toString}")
      OldCsvUploadResponse(csvInfo.id, succeed = true, batchNumber = req.batchNumber, rowsInserted)
    }
  }

  private def addBatchInfo(records: Seq[Record], csvSetting: CsvSetting, batchNumber: Int): Seq[Record] = {
    if (csvSetting.addBatchInfo) {
      records.map(record => record :+ batchNumber)
    } else {
      records
    }
  }
}

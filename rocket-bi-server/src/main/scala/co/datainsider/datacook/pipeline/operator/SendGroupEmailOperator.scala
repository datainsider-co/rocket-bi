package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.persist.EmailConfiguration
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.service.{EmailResponse, EmailService}
import co.datainsider.schema.domain.TableSchema
import com.twitter.finagle.http.MediaType
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import org.apache.commons.io.FileUtils

import java.io.File
import java.nio.file.{Files, Paths}
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.sys.process._

case class SendGroupEmailOperator(
    id: OperatorId,
    receivers: Seq[String],
    cc: Seq[String] = Seq.empty,
    bcc: Seq[String] = Seq.empty,
    subject: String,
    fileNames: Seq[String] = Seq.empty,
    content: Option[String] = None,
    displayName: Option[String] = None,
    isZip: Boolean = false,
    fileType: FileType = FileType.Csv
) extends Operator

case class SendGroupEmailResult(id: OperatorId, attachmentSize: Long, response: EmailResponse) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  override def toString: String = {
    s"SendEmailResult: attachment ${attachmentSize} bytes, status code ${response.statusCode}, response ${response.body}"
  }
}

case class SendGroupEmailOperatorExecutor(
    engine: Engine[_ <: Connection],
    connection: Connection,
    emailService: EmailService,
    baseDir: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000
) extends Executor[SendGroupEmailOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: SendGroupEmailOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      val sourceTables: Seq[TableSchema] = getOperatorResults(operator.parentIds, context.mapResults)
      val folderPath: String = Paths.get(baseDir, context.orgId.toString, System.currentTimeMillis().toString).toAbsolutePath.toString
      try {
        ensureCreatedFolder(folderPath)
        val files: Seq[File] = writeDataToFiles(folderPath, sourceTables, operator.isZip, operator.fileType)
        val mediaType: String = toMediaType(operator)
        val emailConfig = EmailConfiguration(operator.receivers, operator.cc, operator.bcc, operator.subject, "", operator.content)
        val mailResponse: EmailResponse = emailService.send(emailConfig, files.map(_.getPath), mediaType).syncGet()
        SendGroupEmailResult(
          operator.id,
          attachmentSize = files.map(_.length()).sum,
          response = mailResponse
        )
      } finally {
        deleteFolder(folderPath)
      }
    }

  private def toMediaType(operator: SendGroupEmailOperator): String = {
    if (operator.isZip) {
      MediaType.Zip
    } else if (operator.fileType == FileType.Csv) {
      MediaType.Csv
    } else {
      MediaType.Html
    }
  }

  private def ensureCreatedFolder(folderPath: String): Unit = {
    val folder: File = new File(folderPath)
    if (!folder.exists()) {
      Files.createDirectories(Paths.get(folderPath))
    }
  }

  @throws[OperatorException]
  private def zipFiles(filePaths: Seq[String], outputPath: String): File = {
    val zipCmd: ArrayBuffer[String] = ArrayBuffer(
      "zip",
      "-j",
      outputPath
    ) ++ filePaths
    val message: String = zipCmd.!!
    logger.info(s"zip files is success, path of zip is $message")
    val fileZip: File = new File(outputPath)
    ensureFileReady(fileZip)
    fileZip
  }

  private def deleteFolder(path: String): Unit = {
    try {
      FileUtils.deleteDirectory(new File(path))
      info(s"delete folder ${path} success")
    } catch {
      case ex: Throwable =>
        error(s"delete folder ${path} failure, cause ${ex.getMessage}", ex)
    }
  }

  @throws[OperatorException]
  private def writeDataToFiles(
      folderPath: String,
      sourceTables: Seq[TableSchema],
      isZip: Boolean,
      fileType: FileType
  ): Seq[File] = {
    val parser = new QueryParserImpl(engine.getSqlParser())

    val files: Seq[File] = sourceTables.map(tableSchema => {
      val query: String = parser.parse(toObjectQuery(tableSchema))
      val tmpFile: File = prepareFile(folderPath, tableSchema, fileType)
      val finalPath = engine.asInstanceOf[Engine[Connection]].exportToFile(connection, query, tmpFile.getPath, fileType).syncGet()
      val file: File = new File(finalPath)
      ensureFileReady(file)
      file
    })
    if (isZip) {
      val zipName = s"${sourceTables.head.name}_${System.currentTimeMillis()}.zip"
      val outputPath: String = Paths.get(folderPath, zipName).toAbsolutePath.toString
      val fileZip: File = zipFiles(files.map(_.getAbsolutePath), outputPath)
      Seq(fileZip)
    } else {
      files
    }
  }

  private def toObjectQuery(tableSchema: TableSchema): ObjectQuery = {
    val builder = new ObjectQueryBuilder()
    builder.addFunction(new SelectAll())
    builder.addTableView(new TableView(tableSchema.dbName, tableSchema.name))
    builder.build()
  }


  private def prepareFile(folderPath: String, sourceTable: TableSchema, fileType: FileType): File = {
    val fileExtension: String = FileStorage.getFileExtension(fileType)
    val fileName = s"${sourceTable.name}_${System.currentTimeMillis()}.${fileExtension}"
    val filePath: String = Paths.get(folderPath, fileName).toAbsolutePath.toString
    val file: File = new File(filePath)
    if (!file.getParentFile.exists()) {
      file.getParentFile.mkdirs()
    }
    file
  }


  @throws[OperatorException]
  private def ensureFileReady(file: File): Unit = {
    for (nRetry <- 0 until rateLimitRetry) {
      if (file.exists()) {
        return;
      }
      Thread.sleep(sleepInMillis)
    }
    throw new OperatorException(s"wait file ${file.getPath} ready failed, cause retry wait exhausted")
  }

  @throws[InputInvalid]
  private def ensureInput(
      operator: SendGroupEmailOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.isEmpty) {
      throw InputInvalid("only take one input for send to email operator")
    }

    val parentTables: Seq[TableSchema] = getOperatorResults(operator.parentIds, mapResults)
    if (parentTables.size != operator.parentIds.size) {
      throw InputInvalid("missing input for send email operator")
    }
  }

  private def getOperatorResults(
      operatorIds: Seq[OperatorId],
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Seq[TableSchema] = {
    val tableSchemas: Seq[TableSchema] =
      operatorIds.map(id => mapResults.get(id)).filter(_.isDefined).flatMap(_.get.getData[TableSchema]())
    tableSchemas
  }

}

case class MockGroupSendEmailExecutor() extends Executor[SendGroupEmailOperator] with Logging {

  override def execute(operator: SendGroupEmailOperator, context: ExecutorContext): OperatorResult = {

    ensureInput(operator, context.mapResults)
    SendGroupEmailResult(operator.id, 0, EmailResponse(200, ""))
  }

  @throws[InputInvalid]
  private def ensureInput(
      operator: SendGroupEmailOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {
    if (operator.parentIds.isEmpty) {
      throw InputInvalid("only take one input for send to email operator")
    }
    logger.debug(
      s"TestGroupSendEmailExecutor::ensureInput:: parentIds ${operator.parentIds}, mapResults:: ${mapResults.keys}, ${mapResults
        .get(operator.parentIds.head)}"
    )

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for send to email operator")
    }
  }
}

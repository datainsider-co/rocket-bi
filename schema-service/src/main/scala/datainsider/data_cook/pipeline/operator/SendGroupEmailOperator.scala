package datainsider.data_cook.pipeline.operator

import com.twitter.finagle.http.MediaType
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.Using
import datainsider.data_cook.domain.persist.EmailConfiguration
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.{EmailResponse, EmailService}
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler
import org.apache.commons.io.FileUtils

import java.io.File
import java.nio.file.Paths
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.io.Source
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
    isZip: Boolean = false
) extends Operator

case class SendGroupEmailResult(id: OperatorId, attachmentSize: Long, response: EmailResponse) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  override def toString: String = {
    s"SendEmailResult: attachment ${attachmentSize} bytes, status code ${response.statusCode}, response ${response.body}"
  }
}

case class SendGroupEmailOperatorExecutor(
    emailService: EmailService,
    baseDir: String,
    clickhouseHost: String,
    clickhousePort: String,
    clickhouseUser: String,
    clickhousePass: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000
) extends Executor[SendGroupEmailOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def process(operator: SendGroupEmailOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      val sourceTables: Seq[TableSchema] = getOperatorResults(operator.parentIds, context.mapResults)
      val folderPath: String =
        Paths.get(baseDir, context.orgId.toString, context.jobId.toString, System.currentTimeMillis().toString).toString
      try {
        val files: Seq[File] = dumpDataToFiles(folderPath, sourceTables, operator.isZip)
        val mediaType: String = if (operator.isZip) MediaType.Zip else MediaType.Csv
        val emailConfig =
          EmailConfiguration(operator.receivers, operator.cc, operator.bcc, operator.subject, "", operator.content)
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

  @throws[OperatorException]
  private def zipFiles(filePaths: Seq[String], outputPath: String): File = {
    val zipCmd: ArrayBuffer[String] = ArrayBuffer(
      "zip",
      "-j",
      outputPath
    ) ++ filePaths
    val message: String = zipCmd.!!
    info(s"zip files is success, path of zip is $message")
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
  private def dumpDataToFiles(folderPath: String, sourceTables: Seq[TableSchema], isZip: Boolean): Seq[File] = {
    val csvFiles: Seq[File] = sourceTables.map(tableSchema => {
      val csvFile: File = prepareCsvFile(folderPath, tableSchema)
      dumpDataToFile(tableSchema.dbName, tableSchema.name, csvFile)
      ensureFileReady(csvFile)
      ensureFileFormat(csvFile, tableSchema)
      csvFile
    })
    if (isZip) {
      val outputPath: String = Paths.get(folderPath, sourceTables.head.name + ".zip").toString
      val fileZip: File = zipFiles(csvFiles.map(_.getPath), outputPath)
      Seq(fileZip)
    } else {
      csvFiles
    }
  }

  private def dumpDataToFile(dbName: String, tblName: String, file: File): Unit = {
    val dumpCmd: ArrayBuffer[String] = ArrayBuffer(
      "clickhouse-client",
      s"--host=$clickhouseHost",
      s"--port=$clickhousePort",
      s"--user=$clickhouseUser",
      s"--query=select * from `${dbName}`.`${tblName}`",
      "--format=CSVWithNames"
    )
    if (clickhousePass.nonEmpty) {
      dumpCmd += s"--password=$clickhousePass"
    }

    val message: String = dumpCmd.#>(file).!!
    info(s"dump data to file ${file.getPath}, message: ${message}")
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

  @throws[OperatorException]
  private def ensureFileFormat(file: File, tableSchema: TableSchema, delimiter: String = ","): Unit = {
    if (!file.exists()) {
      throw new OperatorException(s"path ${file.toString} not found")
    }
    val columnNames: Array[String] =
      Using(Source.fromFile(file))(source => source.getLines().take(1).mkString("\n")).split(delimiter)
    info(s"ensureFileFormat:: path: ${file.getPath}, sample data: ${columnNames.mkString("Array(", ", ", ")")}")
    if (columnNames.isEmpty) {
      throw new OperatorException(s"dump ${tableSchema.name}.${tableSchema.dbName} to ${file.getPath} incorrect format")
    }
  }

  private def prepareCsvFile(folderPath: String, sourceTable: TableSchema): File = {
    val filePath: String = Paths.get(folderPath, sourceTable.dbName, sourceTable.name + ".csv").toString
    val file: File = new File(filePath)
    if (!file.getParentFile.exists()) {
      file.getParentFile.mkdirs()
    }
    file
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

case class TestGroupSendEmailExecutor() extends Executor[SendGroupEmailOperator] with Logging {

  override def process(operator: SendGroupEmailOperator, context: ExecutorContext): OperatorResult = {

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
    logger.debug(s"TestGroupSendEmailExecutor::ensureInput:: parentIds ${operator.parentIds}, mapResults:: ${mapResults.keys}, ${mapResults.get(operator.parentIds.head)}")

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for send to email operator")
    }
  }
}

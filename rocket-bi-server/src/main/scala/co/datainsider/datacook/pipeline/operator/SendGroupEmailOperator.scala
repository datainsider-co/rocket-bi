package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.persist.EmailConfiguration
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.service.{EmailResponse, EmailService}
import co.datainsider.schema.domain.TableSchema
import com.twitter.finagle.http.MediaType
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.Using
import org.apache.commons.io.FileUtils

import java.io.File
import java.nio.file.Paths
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
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
    source: ClickhouseConnection,
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
      val folderPath: String =
        Paths.get(baseDir, context.orgId.toString, System.currentTimeMillis().toString).toAbsolutePath.toString
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
  private def dumpDataToFiles(folderPath: String, sourceTables: Seq[TableSchema], isZip: Boolean): Seq[File] = {
    val csvFiles: Seq[File] = sourceTables.map(tableSchema => {
      val csvFile: File = prepareCsvFile(folderPath, tableSchema)
      dumpDataToFile(tableSchema.dbName, tableSchema.name, csvFile)
      ensureFileReady(csvFile)
      ensureFileFormat(csvFile, tableSchema)
      csvFile
    })
    if (isZip) {
      val zipName = s"${sourceTables.head.name}_${System.currentTimeMillis()}.zip"
      val outputPath: String = Paths.get(folderPath, zipName).toAbsolutePath.toString
      val fileZip: File = zipFiles(csvFiles.map(_.getAbsolutePath), outputPath)
      Seq(fileZip)
    } else {
      csvFiles
    }
  }

  private def dumpDataToFile(dbName: String, tblName: String, file: File): Unit = {
    val dumpCmd = ArrayBuffer(
      "clickhouse-client",
      s"--host=${source.host}",
      s"--port=${source.tcpPort}",
      s"--user=${source.username}",
      s"--query=select * from `${dbName}`.`${tblName}`",
      "--format=CSVWithNames"
    )
    if (source.password.nonEmpty) {
      dumpCmd += s"--password=${source.password}"
    }
    if (source.useSsl) dumpCmd += s"--secure"

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
    val fileName = s"${sourceTable.dbName}_${sourceTable.name}_${System.currentTimeMillis()}.csv"
    val filePath: String = Paths.get(folderPath, fileName).toAbsolutePath.toString
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

case class SendGroupEmailOperatorExecutor2(
    emailService: EmailService,
    baseDir: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000
) extends Executor[SendGroupEmailOperator] {
  override def execute(operator: SendGroupEmailOperator, context: ExecutorContext): OperatorResult = ???
}

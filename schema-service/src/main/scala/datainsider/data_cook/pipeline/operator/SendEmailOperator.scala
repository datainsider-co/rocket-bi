package datainsider.data_cook.pipeline.operator

import com.twitter.finagle.http.MediaType
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.Using
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.data_cook.domain.persist.EmailConfiguration
import datainsider.data_cook.pipeline.exception.{InputInvalid, OperatorException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.{EmailResponse, EmailService}
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.profiler.Profiler

import java.io.File
import java.nio.file.Paths
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.sys.process._
import scala.util.control.Breaks.{break, breakable}
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * @deprecated use SendGroupEmailOperator instead of
 */
case class SendEmailOperator(
    id: OperatorId,
    receivers: Seq[String],
    cc: Seq[String] = Seq.empty,
    bcc: Seq[String] = Seq.empty,
    subject: String,
    fileName: String,
    content: Option[String] = None,
    displayName: Option[String] = None
) extends Operator

/**
 * @deprecated use SendGroupEmailResult instead of
 */
case class SendEmailResult(id: OperatorId, attachmentSize: Long, response: EmailResponse) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  override def toString: String = {
    s"SendEmailResult: attachment ${attachmentSize} bytes, status code ${response.statusCode}, response ${response.body}"
  }
}

/**
 * @deprecated use SendGroupEmailOperatorExecutor instead of
 */
case class SendEmailOperatorExecutor(
    emailService: EmailService,
    baseDir: String,
    clickhouseHost: String,
    clickhousePort: String,
    clickhouseUser: String,
    clickhousePass: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000
) extends Executor[SendEmailOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def process(operator: SendEmailOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    val sourceTable = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
    var file: File = null

    try {
      file = prepareFile(context.orgId, sourceTable)
      dumpDataToFile(context.orgId, sourceTable.dbName, sourceTable.name, file)
      ensureFileFormat(file, sourceTable)
      val emailConfig = EmailConfiguration(
        operator.receivers,
        operator.cc,
        operator.bcc,
        operator.subject,
        operator.fileName,
        operator.content
      )
      val mailResponse: EmailResponse = emailService.send(emailConfig, file.getPath, MediaType.Csv).syncGet()
      SendEmailResult(
        operator.id,
        attachmentSize = file.length(),
        response = mailResponse
      )

    } finally {
      info(s"send email with attachment name ${operator.fileName} is done")
      if (file != null) {
        try {
          file.delete()
          info(s"delete attachment path ${file.getPath} is done")
        } catch {
          case ex: Throwable =>
            // ignore exception
            error(s"delete attachment failure, cause ${ex.getMessage}", ex)
        }
      }
    }

  }

  def buildDumpCmd(dbName: DBName, tblName: TblName): Seq[String] = {
    val dumpCmd = ArrayBuffer(
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

    dumpCmd
  }

  @throws[OperatorException]
  private def dumpDataToFile(organizationId: OrganizationId, dbName: String, tblName: String, file: File): Unit = {
    val dumpCmd: Seq[String] = buildDumpCmd(dbName, tblName)
    dumpCmd.#>(file).!!
    ensureFileReady(file)
  }

  @throws[OperatorException]
  private def ensureFileReady(file: File): Unit = {
    var nRetry = 0
    breakable {
      while (true) {
        nRetry += 1
        if (file.exists()) {
          break;
        }
        if (nRetry > rateLimitRetry) {
          throw new OperatorException(s"wait file ${file.getPath} ready failed, cause retry wait exhausted")
        } else {
          Thread.sleep(sleepInMillis)
        }
      }
    }
  }

  @throws[OperatorException]
  private def ensureFileFormat(file: File, tableSchema: TableSchema, delimiter: String = ","): Unit = {
    if (!file.exists()) {
      throw new OperatorException(s"path ${file.toString} not found")
    }
    val columnNames: Array[String] = Using(Source.fromFile(file))(source => source.getLines().take(1).mkString("\n")).split(delimiter)
    info(s"ensureFileFormat:: path: ${file.getPath}, sample data: ${columnNames.mkString("Array(", ", ", ")")}")
    if (columnNames.isEmpty) {
      throw new OperatorException(s"dump ${tableSchema.name}.${tableSchema.dbName} to ${file.getPath} incorrect format")
    }
  }

  private def prepareFile(organizationId: OrganizationId, sourceTable: TableSchema): File = {
    val filePath: String = Paths.get(baseDir, organizationId.toString, System.currentTimeMillis().toString, sourceTable.dbName, sourceTable.name + ".csv").toString
    val file: File = new File(filePath)
    if (!file.getParentFile.exists()) {
      file.getParentFile.mkdirs()
    }
    file
  }

  @throws[InputInvalid]
  private def ensureInput(operator: SendEmailOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for send to email operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for send to email operator")
    }

  }

}

/**
 * @deprecated use TestGroupSendEmailExecutor instead of
 */
case class TestSendEmailExecutor() extends Executor[SendEmailOperator] {

  override def process(operator: SendEmailOperator, context: ExecutorContext): OperatorResult = {

    ensureInput(operator, context.mapResults)
    SendEmailResult(operator.id, 0, EmailResponse(200, ""))

  }

  @throws[InputInvalid]
  private def ensureInput(operator: SendEmailOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for send to email operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for send to email operator")
    }

  }

}

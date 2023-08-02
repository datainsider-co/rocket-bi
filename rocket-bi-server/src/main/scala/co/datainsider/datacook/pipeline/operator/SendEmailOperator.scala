package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.Ids.OrganizationId
import co.datainsider.datacook.domain.persist.EmailConfiguration
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.service.{EmailResponse, EmailService}
import co.datainsider.schema.domain.TableSchema
import com.twitter.finagle.http.MediaType
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.Using

import java.io.File
import java.nio.file.Paths
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.sys.process._
import scala.util.control.Breaks.{break, breakable}

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
    source: ClickhouseConnection,
    emailService: EmailService,
    baseDir: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000
) extends Executor[SendEmailOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: SendEmailOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

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
        val mailResponse: EmailResponse = emailService.send(emailConfig, file.getAbsolutePath, MediaType.Csv).syncGet()
        SendEmailResult(
          operator.id,
          attachmentSize = file.length(),
          response = mailResponse
        )

      } finally {
        if (file != null) {
          try {
            file.delete()
          } catch {
            case ex: Throwable =>
              // ignore exception
              error(s"delete attachment failure, cause ${ex.getMessage}", ex)
          }
        }
      }

    }

  private def buildDumpCmd(dbName: String, tblName: String): Seq[String] = {
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
    val columnNames: Array[String] =
      Using(Source.fromFile(file))(source => source.getLines().take(1).mkString("\n")).split(delimiter)
    if (columnNames.isEmpty) {
      throw new OperatorException(s"dump ${tableSchema.name}.${tableSchema.dbName} to ${file.getPath} incorrect format")
    }
  }

  private def prepareFile(organizationId: OrganizationId, sourceTable: TableSchema): File = {
    val fileName: String = s"${sourceTable.dbName}_${sourceTable.name}_${System.currentTimeMillis()}.csv"
    val filePath: String = Paths.get(baseDir, organizationId.toString, fileName).toString
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
case class MockSendEmailExecutor() extends Executor[SendEmailOperator] {

  override def execute(operator: SendEmailOperator, context: ExecutorContext): OperatorResult = {

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

case class SendEmailOperatorExecutor2(
    emailService: EmailService,
    baseDir: String,
    rateLimitRetry: Int = 20,
    sleepInMillis: Int = 1000,
    clickhouseUseSsl: Boolean = false
) extends Executor[SendEmailOperator] {
  override def execute(operator: SendEmailOperator, context: ExecutorContext): OperatorResult = ???
}

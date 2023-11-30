package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.pipeline.exception.{InputInvalid, OperatorException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.service.EmailResponse
import co.datainsider.schema.domain.TableSchema
import com.twitter.util.logging.Logging

import scala.collection.mutable

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
case class SendEmailOperatorExecutor(executor: Executor[SendGroupEmailOperator]) extends Executor[SendEmailOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[OperatorException]
  override def execute(operator: SendEmailOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {
    val groupEmailOperator: SendGroupEmailOperator = convertToGroupEmailOperator(operator)
    executor.execute(groupEmailOperator, context)
  }

  private def convertToGroupEmailOperator(operator: SendEmailOperator): SendGroupEmailOperator = {
    SendGroupEmailOperator(
      id = operator.id,
      receivers = operator.receivers,
      cc = operator.cc,
      bcc = operator.bcc,
      subject = operator.subject,
      fileNames = Seq(operator.fileName),
      content = operator.content,
      displayName = operator.displayName,
      isZip = false,
      fileType = FileType.Csv
    )
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

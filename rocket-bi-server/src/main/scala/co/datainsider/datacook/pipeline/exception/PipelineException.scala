package co.datainsider.datacook.pipeline.exception

import com.twitter.finagle.http.Status
import datainsider.client.exception.{DIErrorReason, DIException}

object PipelineExceptionReason {
  val PipelineException = "pipeline_exception"
  val UnsupportedOperator = "unsupported_operator"
  val UnsupportedExecutor = "unsupported_executor"
  val UnknownPipelineException = "unknown_pipeline_exception"
  val InterruptedPipelineException = "interrupted_pipeline_exception"
  val OperatorException = "operator_exception"
  val UnsupportedJDBCWriterException = "unsupported_jdbc_writer"
  val InputInvalid = "input_invalid"
  val DropTableException = "drop_table_exception"
  val CreateDatabaseException = "create_database_exception"
  val CreateTableException = "create_table_exception"
  val ListDatabaseException = "list_database_exception"
  val ListTableException = "list_table_exception"
}

class PipelineException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = PipelineExceptionReason.PipelineException

  override def getStatus: Status = Status.InternalServerError
}

case class UnsupportedOperatorException(message: String) extends PipelineException(message) {
  override val reason: String = PipelineExceptionReason.UnsupportedOperator
}

case class UnsupportedExecutorException(message: String) extends PipelineException(message) {
  override val reason: String = PipelineExceptionReason.UnsupportedExecutor
}

case class UnknownPipelineException(message: String) extends PipelineException(message) {
  override val reason: String = PipelineExceptionReason.UnknownPipelineException
}

case class TerminatedPipelineException(message: String) extends PipelineException(message) {
  override val reason: String = PipelineExceptionReason.UnknownPipelineException
}

class OperatorException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.OperatorException
}

case class UnsupportedJDBCWriterException(message: String, cause: Throwable = null)
    extends OperatorException(message, cause) {
  override val reason: String = PipelineExceptionReason.UnsupportedJDBCWriterException
}

case class InputInvalid(message: String) extends OperatorException(message) {
  override val reason: String = PipelineExceptionReason.InputInvalid
}

case class DropTableException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.DropTableException
}

case class CreateDatabaseException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.CreateDatabaseException
}

case class CreateTableException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.CreateTableException
}

case class ListDatabaseException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.ListDatabaseException
}

case class ListTableException(message: String, cause: Throwable = null) extends PipelineException(message, cause) {
  override val reason: String = PipelineExceptionReason.ListTableException
}

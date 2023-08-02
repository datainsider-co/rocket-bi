package co.datainsider.datacook.pipeline.operator.persist

import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.OperatorResult

case class JdbcPersistResult(id: OperatorId, insertedRows: Long, totalRows: Long) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  def errorRows: Long = totalRows - insertedRows

  override def toString: String = {
    s"JdbcPersistResult: ${insertedRows}/${totalRows} (inserted/total), ${errorRows} error rows"
  }
}

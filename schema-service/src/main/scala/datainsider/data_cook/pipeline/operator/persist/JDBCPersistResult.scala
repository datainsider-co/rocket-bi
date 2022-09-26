package datainsider.data_cook.pipeline.operator.persist

import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.OperatorResult

case class JDBCPersistResult(id: OperatorId, insertedRows: Long, totalRows: Long) extends OperatorResult {
  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  def errorRows = totalRows - insertedRows

  override def toString: String = {
    s"JDBCPersistResult: ${insertedRows}/${totalRows} (inserted/total), ${errorRows} error rows"
  }
}

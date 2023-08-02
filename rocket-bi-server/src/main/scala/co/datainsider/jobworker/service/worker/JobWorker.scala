package co.datainsider.jobworker.service.worker

import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain._
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import com.twitter.util.Future

/**
  * @deprecated use JobWorker2 instead
  */
trait JobWorker[T <: Job] {
  def run(job: T, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress

  def mergeTableSchema(sourceTable: TableSchema, destTableOption: Option[TableSchema]): TableSchema = {
    destTableOption match {
      case None => sourceTable
      case Some(destTable) =>
        val newColumns: Seq[Column] = mergeColumns(sourceTable.columns, destTable.columns)
        destTable.copy(name = sourceTable.name, columns = newColumns)
    }
  }

  private def mergeColumns(sourceColumns: Seq[Column], destColumns: Seq[Column]): Seq[Column] = {
    val newColumns = sourceColumns.filter(sourceColumn => {
      !destColumns.exists(_.name.equals(sourceColumn.name))
    })
    destColumns ++ newColumns
  }
}

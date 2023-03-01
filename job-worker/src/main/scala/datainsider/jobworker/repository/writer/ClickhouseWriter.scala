package datainsider.jobworker.repository.writer

import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.client.util.JdbcClient.Record
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient

import scala.concurrent.ExecutionContext.Implicits.global

class ClickhouseWriter(client: JdbcClient) extends DataWriter {

  override def write(records: Seq[Record], destSchema: TableSchema): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::write") {
      val dbName: String = destSchema.dbName
      val tblName: String = destSchema.name
      val columns: Seq[Column] = destSchema.columns

      val colNames = columns.map(c => s"`${c.name}`").mkString(",")
      val questionMarks = Array.fill(columns.length)("?").mkString(",")
      val query =
        s"""
           |insert into $dbName.$tblName ($colNames)
           |values ($questionMarks);
           |""".stripMargin

      client.executeBatchUpdate(query, records)
    }

  override def finishing(): Unit = Future.Unit
}

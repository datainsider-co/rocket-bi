package co.datainsider.jobworker.repository.writer

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import com.twitter.util.Future

@deprecated("use FileClickhouseWriter instead")
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

      client.executeBatchUpdate(query, records.toArray)
    }

  override def close(): Unit = Future.Unit
}

package datainsider.jobworker.repository.writer

import datainsider.client.domain.schema.TableSchema
import datainsider.client.util.JdbcClient.Record
import datainsider.client.util.ZConfig
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.DataDestination

trait DataWriter {

  /***
    * persist data to a jdbc source
    * @param records list of rows to be inserted
    * @return number of row inserted
    */
  def write(records: Seq[Record], destSchema: TableSchema): Int // TODO: get info from job instead of TableSchema

  /***
    * Finalize and wait until all data in written to destination source
    * @return
    */
  def finishing(): Unit
}

object DataWriter {

  def apply(destination: DataDestination): DataWriter = {
    destination match {
      case DataDestination.Clickhouse => new FileClickhouseWriter(ZConfig.getConfig("clickhouse-writer"))
      case DataDestination.Hadoop     => new HadoopWriter(ZConfig.getConfig("hadoop-writer"))
    }
  }

}

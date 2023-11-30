package co.datainsider.jobworker.repository.writer

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.{ClientManager, Engine}
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.engine.factory.EngineResolverImpl
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.DataDestination
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.exception.DataWriterException
import co.datainsider.schema.domain.TableSchema

trait DataWriter extends AutoCloseable {

  /** *
    * persist data to a jdbc source
    *
    * @param records list of rows to be inserted
    * @return number of row inserted
    */
  def insertBatch(records: Seq[Record], destSchema: TableSchema): Int

  /** *
    * Finalize and wait until all data in written to destination source
    *
    * @return
    * @throws DataWriterException if error when finishing
    */
  @throws[DataWriterException]
  def close(): Unit
}

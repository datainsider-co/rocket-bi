package co.datainsider.jobworker.repository.reader

import co.datainsider.jobworker.exception.{CompletedReaderException, ReaderException}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import datainsider.client.util.JsonParser
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.Using

import scala.io.Source

/**
 * Reader is used to read data from source and job.
 * Worker will init reader, reader data and close it.
 */
trait Reader extends AutoCloseable {

  /**
   * check reader has next record, method will called before next()
   * @return true if reader has next record, false if reader completed
   */
  def hasNext(): Boolean

  /**
    * Get the next records by columns. The order of results returned must match the order of columns.
    * if row is null, then return a list of null Seq(Seq(null, null, null))
    * if return empty list, then reader will call hasNext() to check if reader completed
    */
  @throws[ReaderException]("get next record failed")
  @throws[CompletedReaderException]("mark already reader completed")
  def next(columns: Seq[Column]): Seq[Record]

  /**
   * Get table schema of reader, this method will be called only once
   * @return current table schema from reader
   */
  def detectTableSchema(): TableSchema

  /**
   * Close reader, this method will be called after reader completed.
   * If reader has error, this method will be called too.
   * Method will be called only once
   */
  def close(): Unit

  /**
   * Get mode of reader, if reader is incremental mode, method getLasSyncValue() will be called
   * @return true if reader is incremental mode, false if reader is full mode
   */
  def isIncrementalMode(): Boolean

  /**
   * Get last sync value of reader, method will be called every time reader completed
   * @return last sync value of reader. If reader is full mode, return None
   */
  def getLastSyncValue(): Option[String]
}


object Reader {

  /**
   * Read columns from json, path relative from resource folder
   *
   * @param path relative folder in resource folder
   * @return
   */
  def readColumns(path: String): Seq[Column] = {
    Using(getClass.getClassLoader.getResourceAsStream(path)) {
      inputStream =>
        Using(Source.fromInputStream(inputStream)) {
          source => JsonParser.fromJson[Seq[Column]](source.mkString)
        }
    }
  }
}

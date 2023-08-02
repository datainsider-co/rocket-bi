package co.datainsider.jobworker.repository.reader

import co.datainsider.schema.domain.TableSchema
import co.datainsider.bi.client.JdbcClient.Record

import java.io.File

trait FileReader extends AutoCloseable {

  /**
    * Kiểm tra file hiện tại còn data không
    */
  def hasNext(): Boolean

  /**
    * Nếu file hiện tại còn data thì trả về next n line của file hiện tại -> parse thành record
    * Nếu file hiện tại đã hết data -> download file tiếp theo nếu có
    */
  def next(destSchema: TableSchema): Seq[Record]

  /**
    * detect table schema of current file
    * @return table schema
    */
  def detectTableSchema(): TableSchema

  def getFile: File

  /**
    * close reader, dọn dẹp resources
    */
  def close(): Unit
}

package co.datainsider.datacook.pipeline.operator.persist.writer

import co.datainsider.datacook.pipeline.exception.{CreateDatabaseException, CreateTableException, DropTableException}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column

/**
  * Lop nay handle viec write data vao database
  */
trait JDBCWriter {

  /**
    * Wirte danh sach records vao destination voi danh sach columns cho truoc.
    * @return so luong record da duoc write
    */
  def write(dbName: String, tableName: String, columns: Seq[Column], records: Seq[Seq[Any]]): Int

  /**
    * Kiem tra xem table co ton tai hay chua, neu gap exception se tra ve false
    */
  def isTableExisted(dbName: String, tableName: String): Boolean

  /**
    * Chac chan table da ton tai va phu hop voi schema cho truoc
    */
  @throws[CreateDatabaseException]("Neu database khong khong the tao duoc")
  @throws[CreateTableException]("Neu table khong the tao duoc")
  def ensureTableCreated(tableSchema: TableSchema): Unit

  /**
    * Drop table neu co
    */
  @throws[DropTableException]("Neu khong the drop duoc table")
  def dropTable(dbName: String, tableName: String): Unit

}

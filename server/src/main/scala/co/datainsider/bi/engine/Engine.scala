package co.datainsider.bi.engine

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query.{AggregateCondition, Condition, Function, ScalarFunction, TableView}
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.common.client.exception.DbExecuteError
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future

trait Engine extends AutoCloseable with ClosingNotifier {

  /**
    * current connection to data source
    */
  val connection: Connection

  /**
    * execute sql query and return result
    *
    * @param sql          query using sql language
    * @param doFormatValues is format values, if true, will format values to specific type
    * @return DataTable contains query result
    */
  @throws[DbExecuteError]("when sql execute error like syntax error")
  @throws[InternalError]("execute error like cannot format value")
  def execute(sql: String, doFormatValues: Boolean = true): Future[DataTable]

  /**
    * execute sql query as stream, stream data will be passed to fn and auto close after fn finish
    */
  @throws[DbExecuteError]("when sql execute error like syntax error")
  @throws[InternalError]("execute error occur")
  def executeAsDataStream[T](query: String)(fn: DataStream => T): T

  def executeHistogramQuery(histogramSql: String): Future[DataTable]

  /**
    * get ddl executor for create table, drop table, etc.
    *
    * @return the implementation of DDLExecutor
    */
  def getDDLExecutor(): DDLExecutor

  def exportToFile(sql: String, destPath: String, fileType: FileType): Future[String]

  /**
    * test connection to data source
    * @param source data source info
    * @return true if connection is ok
    */
  def testConnection(): Future[Boolean]

  /**
    * get sql parser for specific sql language
    * @return the implementation of SqlParser
    */
  def getSqlParser(): SqlParser

  /**
    * @throws DbExecuteError when sql execute error like syntax error
    */
  def detectExpressionColumn(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column]

  /**
    * @throws DbExecuteError when sql execute error like syntax error
    */
  def detectAggregateExpressionColumn(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column]

  def write(schema: TableSchema, records: Seq[Record]): Future[Int]

  override def close(): Unit = {
    beforeClosing()
    notifyClose()
  }

  /**
    * do something before closing engine
    */
  protected def beforeClosing(): Unit
}

/*
 * parse function and condition to specific sql language syntax
 */
trait SqlParser {

  def toQueryString(condition: Condition): String

  def toQueryString(aggregateCondition: AggregateCondition): String

  def toQueryString(function: Function): String

  def toQueryString(scalarFn: ScalarFunction, field: String): String

  def toAliasName(function: Function): String

  def toSelectField(function: Function, useAliasName: Boolean): String

  def toHistogramSql(fieldName: String, baseSql: String, numBins: Int): String

  def toTableViewFullName(view: TableView): String = {
    s"${view.dbName}.${view.tblName}"
  }
}

case class DataStream(columns: Seq[Column], stream: Iterator[Record])

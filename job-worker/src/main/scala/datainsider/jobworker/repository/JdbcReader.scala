package datainsider.jobworker.repository

import datainsider.client.domain.schema.TableSchema
import datainsider.jobworker.client.JdbcClient
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.{DatabaseType, JdbcJob, JdbcSource}
import datainsider.jobworker.repository.reader.sqlserver.SqlServerReader
import datainsider.jobworker.repository.reader.{BigQueryReader, GenericJdbcReader, MySqlReader, OracleReader, PostgresReader, RedshiftReader}

import java.sql.ResultSet

/**
  * handle read data from jdbc compatible database
  * using iterator style to get data
  */
trait JdbcReader {

  /**
    * get schema info of a table (tbl name, col types, col names, default values)
    * @return TableSchema object gotten from SchemaService
    */
  def getTableSchema: TableSchema

  /**
    * retrieve next batch of data
    * @return
    */
  def next: Seq[Record]

  /**
    * check if is there any next data from this sync session
    * @return
    */
  def hasNext: Boolean

  /**
    * last value of batch to keep track of job progress
    * @return
    */
  def getLastSyncedValue: String

  /**
   * close client connection if
   */
  def closeConnection(): Unit

}

object JdbcReader {
  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int): JdbcReader = {
    source.databaseType match {
      case DatabaseType.MySql     => MySqlReader(source, job, batchSize)
      case DatabaseType.Oracle    => OracleReader(source, job, batchSize)
      case DatabaseType.SqlServer => SqlServerReader(source, job, batchSize)
      case DatabaseType.BigQuery  => BigQueryReader(source, job, batchSize)
      case DatabaseType.Redshift  => RedshiftReader(source, job, batchSize)
      case DatabaseType.Postgres  => PostgresReader(source, job, batchSize)
      case DatabaseType.Other     => ???
      case _                      => throw new UnsupportedOperationException("database not supported")
    }
  }
}

trait SimpleReader extends JdbcReader {
  val client: JdbcClient
  val offset: Int
  val dbName: String
  val tblName: String
  val batchSize: Int
  val queryStatement: Option[String]

  protected def buildGetTotalQuery: String
  protected def buildNextBatchQuery(curRow: Int): String
  protected def toRecords(rs: ResultSet): Seq[Record]
  protected def toTableSchema(rs: ResultSet): TableSchema

  private var curRow: Int = offset
  private var isBatchEmpty: Boolean = false
  private lazy val total: Int = getTotal

  override def getTableSchema: TableSchema = {
    val query: String = buildNextBatchQuery(curRow)
    client.executeQuery(query)(toTableSchema)
  }

  private def getTotal: Int = {
    val query: String = buildGetTotalQuery

    client.executeQuery(query)(rs => {
      if (rs.next()) rs.getInt(1)
      else 0
    })
  }

  override def next: Seq[Record] = {
    val query: String = buildNextBatchQuery(curRow)

    client.executeQuery(query)(rs => {
      val records: Seq[Record] = toRecords(rs)
      if (records.isEmpty) isBatchEmpty = true
      else curRow += records.length
      records
    })
  }

  override def hasNext: Boolean = (curRow < total) && !isBatchEmpty

  override def getLastSyncedValue: String = curRow.toString

  override def closeConnection(): Unit = Unit
}

trait IncrementalColumnReader extends JdbcReader {
  val client: JdbcClient
  val lowerBound: String
  val dbName: String
  val tblName: String
  val batchSize: Int
  val incrementalColName: String
  val queryStatement: Option[String]

  private val upperBound: String = getUpperBound
  lazy private val incrementalColIndex: Int = getTableSchema.columns.indexWhere(_.name == incrementalColName)

  private var lastSyncedValue: String = lowerBound
  private var isBatchEmpty: Boolean = false

  private var batchWithOnlyOneValue: Boolean = false
  private var curSingleValueRowNum: Int = 0
  private var curSingleValue: String = ""

  protected def toRecords(rs: ResultSet): Seq[Record]
  protected def toTableSchema(rs: ResultSet): TableSchema
  protected def buildUpperBoundQuery(): String
  protected def buildQueryByRange(lowerBound: String, upperBound: String): String
  protected def buildQueryByValue(currentValue: String, offset: Int): String
  override def getTableSchema: TableSchema = {
    val query: String = buildQueryByRange(lastSyncedValue, upperBound)
    client.executeQuery(query)(toTableSchema)
  }

  /**
    * first determine upperBound value (most recent un-synced value)
    * rows to be synced will be in range (lastSyncValue, upperBound)
    * upper bound value may not finish yet, thus will be synced in next time, not this time
    * query until batch is empty
    *
    * there is case that record of range (value1, value2) can not fit in 1 batch -> use limit offset to get all data
    *  @return
    */
  override def next: Seq[Record] = {

    if (!batchWithOnlyOneValue) {
      val records: Seq[Record] = queryByRange(lastSyncedValue, upperBound) // (lowerBound, upperBound)
      if (
        records.nonEmpty && records.last(incrementalColIndex).toString == records.head(incrementalColIndex).toString
      ) {
        batchWithOnlyOneValue = true // switch to limit offset query
        curSingleValue = records.last(incrementalColIndex).toString
        curSingleValueRowNum = 0
        Seq.empty[Record]
      } else if (records.nonEmpty) {
        val lastRowValue: String = records.last(incrementalColIndex).toString // this value range may not finish yet
        val recordsToBeInserted: Seq[Record] = records.filterNot(r => r(incrementalColIndex).toString == lastRowValue)
        lastSyncedValue = recordsToBeInserted.last(incrementalColIndex).toString
        recordsToBeInserted
      } else {
        isBatchEmpty = true
        Seq.empty[Record]
      }

    } else {
      val records: Seq[Record] = queryByValue(curSingleValue, curSingleValueRowNum)
      if (records.nonEmpty) {
        curSingleValueRowNum += records.length
        records
      } else {
        batchWithOnlyOneValue = false // switch back to normal query
        lastSyncedValue = curSingleValue
        Seq.empty[Record]
      }
    }

  }

  override def hasNext: Boolean = !isBatchEmpty && upperBound != null

  override def getLastSyncedValue: String = lastSyncedValue

  override def closeConnection(): Unit = Unit

  /***
    * return last value >= lowerBound
    * @return
    */
  private def getUpperBound: String = {
    val query: String = buildUpperBoundQuery()
    client.executeQuery(query)(rs => {
      if (rs.next()) rs.getString(incrementalColName)
      else ""
    })
  }

  private def queryByRange(lowerBound: String, upperBound: String): Seq[Record] = {
    val query: String = buildQueryByRange(lowerBound, upperBound)
    client.executeQuery(query)(toRecords)
  }

  private def queryByValue(currentValue: String, offset: Int): Seq[Record] = {
    val query: String = buildQueryByValue(currentValue, offset)
    client.executeQuery(query)(toRecords)
  }

}

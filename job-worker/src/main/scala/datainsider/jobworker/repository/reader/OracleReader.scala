package datainsider.jobworker.repository.reader

import com.twitter.inject.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{Column, DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.{JdbcJob, JdbcSource}
import datainsider.jobworker.repository.JdbcReader
import datainsider.jobworker.util.ZConfig

import java.sql.{Connection, ResultSet, Statement}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

object OracleReader {

  /* HOTFIX timezone not found bug: https://stackoverflow.com/questions/9156379/ora-01882-timezone-region-not-found */
  System.setProperty("oracle.jdbc.timezoneAsRegion", "false")

  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int): JdbcReader = {
    val client: JdbcClient = NativeJdbcClient(source.jdbcUrl, source.username, source.password)

    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalOracleReader(
          client,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query
        )
      case None =>
        new SimpleOracleReader(client, job.databaseName, job.tableName, job.lastSyncedValue.toInt, batchSize, job.query)
    }
  }
}

class BaseOracleReader(client: JdbcClient, dbName: String, tblName: String) extends Logging {

  /**
    * https://docs.oracle.com/cd/B19306_01/java.102/b14188/datamap.htm
    * @return
    */
  protected def toColumns(colNames: Seq[String], colTypes: Seq[String]): Seq[Column] = {
    colNames.zip(colTypes).map {
      case (colName, colType) =>
        colType match {
          case t if isNumber(t) => DoubleColumn(colName, colName, isNullable = true)
          case t if isString(t) => StringColumn(colName, colName, isNullable = true)
          case t if isDate(t)   => DateTimeColumn(colName, colName, isNullable = true)
          case _ =>
            logger.info(s"oracle type not supported: $colType")
            StringColumn(colName, colName, isNullable = true)
        }
    }
  }

  protected def getMetaData(rs: ResultSet): (Array[String], Array[String]) = {
    val metadata = rs.getMetaData
    val colCount = metadata.getColumnCount
    val colNames = ArrayBuffer.empty[String]
    val colTypes = ArrayBuffer.empty[String]
    for (i <- 1 to colCount) {
      colNames += metadata.getColumnName(i)
      colTypes += metadata.getColumnTypeName(i)
    }
    (colNames.toArray, colTypes.toArray)
  }

  protected def getQuerySchema(colNames: Array[String], colTypes: Array[String]): TableSchema = {
    TableSchema(tblName, dbName, -1L, tblName, toColumns(colNames, colTypes))
  }

  protected def toRecords(rs: ResultSet): Seq[Record] = {
    val rows = ArrayBuffer.empty[Record]
    val (colNames, colTypes) = getMetaData(rs)

    while (rs.next()) {
      val row = toRecord(rs, colNames, colTypes)
      rows += row
    }

    rows
  }

  protected def toRecord(rs: ResultSet, colNames: Seq[String], colTypes: Seq[String]): Record = {
    val row = ArrayBuffer.empty[Any]

    colNames.zip(colTypes).foreach {
      case (colName, colType) =>
        val item = colType match {
          case t if isNumber(t) => rs.getDouble(colName)
          case t if isString(t) => rs.getString(colName)
          case t if isDate(t)   => rs.getTimestamp(colName)
          case _ =>
            try {
              rs.getString(colName)
            } catch {
              case _: Throwable =>
                logger.info(s"oracle datatype not supported, $colName")
                null
            }
        }
        row += item
    }

    row
  }

  protected def toTableSchema(rs: ResultSet): TableSchema = {
    val (colNames, colTypes) = getMetaData(rs)
    getQuerySchema(colNames, colTypes)
  }

  protected def isString(colType: String): Boolean = {
    colType.toLowerCase.contains("char")
  }

  protected def isNumber(colType: String): Boolean = {
    colType.toLowerCase.contains("number")
  }

  protected def isDate(colType: String): Boolean = {
    colType.toLowerCase.contains("date") || colType.toLowerCase.contains("timestamp")
  }

}

class SimpleOracleReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseOracleReader(client = client, dbName = dbName, tblName = tblName)
    with JdbcReader {

  private val FETCH_SIZE: Int = ZConfig.getInt("jdbc_worker.oracle.jdbc_fetch_size", 1000)

  private val SELECT_ALL_SQL = s"""select * from "$dbName"."$tblName" """
  private val SELECT_SAMPLE_SQL = s"""select * from "$dbName"."$tblName" WHERE 1 != 1"""
  private val SELECT_TOTAL_SQL = s"""select count(1) from "$dbName"."$tblName" """

  info(s"${this.getClass.getSimpleName}:: SELECT_ALL_SQL: $SELECT_ALL_SQL")
  info(s"${this.getClass.getSimpleName}:: SELECT_SAMPLE_SQL: $SELECT_SAMPLE_SQL")
  info(s"${this.getClass.getSimpleName}:: SELECT_TOTAL_SQL: $SELECT_TOTAL_SQL")

  private val conn: Connection = client.getConnection()
  conn.setAutoCommit(false)
  conn.setReadOnly(true)

  private val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(FETCH_SIZE)

  lazy private val rs: ResultSet = stmt.executeQuery(SELECT_ALL_SQL)

  private var numReadRows: Long = 0
  lazy private val totalRows: Long = getTotal()
  lazy private val (colNames, colTypes) = getColNamesAndTypes()

  override def getTableSchema: TableSchema = {
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      client.executeQuery(SELECT_SAMPLE_SQL)(toTableSchema)
    }
  }

  override def next: Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      var rowCount: Int = 0
      val rows = ArrayBuffer.empty[Record]

      while (rowCount < batchSize) {
        if (rs.next()) {
          val row: Record = toRecord(rs, colNames, colTypes)
          rows += row
        }

        rowCount += 1
        numReadRows += 1
      }

      rows
    }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      numReadRows < totalRows
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      numReadRows.toString
    }

  override def closeConnection(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::closeConnection") {
      rs.close()
      stmt.close()
      conn.close()
    }

  private def getTotal(): Long =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTotal") {
      client.executeQuery(SELECT_TOTAL_SQL)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    }

  private def getColNamesAndTypes(): (Array[String], Array[String]) =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getColNamesAndTypes") {
      client.executeQuery(SELECT_SAMPLE_SQL)(getMetaData)
    }
}

class IncrementalOracleReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseOracleReader(client, dbName, tblName)
    with JdbcReader {

  private val FETCH_SIZE: Int = ZConfig.getInt("jdbc_worker.oracle.jdbc_fetch_size", 1000)

  private val SELECT_INCREMENTAL_SQL =
    s"""
       |select * from "$dbName"."$tblName"
       |where "$incrementalColName" > ${toValue(lowerBound)}
       |order by "$incrementalColName"
       |""".stripMargin

  private val SELECT_SAMPLE_SQL = s"""select * from "$dbName"."$tblName" WHERE 1 != 1"""
  private val SELECT_TOTAL_SQL =
    s"""
       |select count(1) from "$dbName"."$tblName"
       |where "$incrementalColName" > ${toValue(lowerBound)}
       |order by "$incrementalColName"
       |""".stripMargin

  info(s"${this.getClass.getSimpleName}:: SELECT_INCREMENTAL_SQL: $SELECT_INCREMENTAL_SQL")
  info(s"${this.getClass.getSimpleName}:: SELECT_SAMPLE_SQL: $SELECT_SAMPLE_SQL")
  info(s"${this.getClass.getSimpleName}:: SELECT_TOTAL_SQL: $SELECT_TOTAL_SQL")

  private val conn: Connection = client.getConnection()
  conn.setAutoCommit(false)
  conn.setReadOnly(true)

  private val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(FETCH_SIZE)

  lazy private val rs: ResultSet = stmt.executeQuery(SELECT_INCREMENTAL_SQL)

  private var numReadRows: Long = 0
  private var lastReadValue: String = lowerBound
  lazy private val totalRows: Long = getTotal()
  lazy private val (colNames, colTypes) = getColNamesAndTypes()

  override def getTableSchema: TableSchema = {
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      client.executeQuery(SELECT_SAMPLE_SQL)(toTableSchema)
    }
  }

  override def next: Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      var rowCount: Int = 0
      val rows = ArrayBuffer.empty[Record]

      while (rowCount < batchSize) {
        if (rs.next()) {
          val row: Record = toRecord(rs, colNames, colTypes)
          rows += row
        }

        rowCount += 1
        numReadRows += 1
        lastReadValue = rs.getString(incrementalColName)
      }

      rows
    }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      numReadRows < totalRows
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      lastReadValue
    }

  override def closeConnection(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::closeConnection") {
      rs.close()
      stmt.close()
      conn.close()
    }

  private def getTotal(): Long =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTotal") {
      client.executeQuery(SELECT_TOTAL_SQL)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    }

  private def getColNamesAndTypes(): (Array[String], Array[String]) =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getColNamesAndTypes") {
      client.executeQuery(SELECT_SAMPLE_SQL)(getMetaData)
    }

  /***
    * check str if str is a number -> don't add quote
    * else (str is string or date) -> add quotes
    * @param str condition value in string
    * @return
    */
  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}

package datainsider.jobworker.repository.reader

import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.{JdbcJob, JdbcSource}
import datainsider.jobworker.repository.{IncrementalColumnReader, JdbcReader, SimpleReader}
import datainsider.jobworker.util.ZConfig

import java.sql.{Connection, ResultSet, Statement}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

object PostgresReader {
  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int): JdbcReader = {
    val client: JdbcClient = NativeJdbcClient(source.jdbcUrl, source.username, source.password)
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalPostgresReader(
          client,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query
        )
      case None =>
        new SimplePostgresReader(
          client,
          job.databaseName,
          job.tableName,
          job.lastSyncedValue.toInt,
          batchSize,
          job.query
        )
    }
  }
}

/**
  * handle read data from database
  * once created, reader will determine lower bound value and upper bound value to limit
  * the amount of data to be synced in this session
  * the lower bound value will be gotten from job info (last successful synced value)
  * the upper value will be the newest un-synced data at the requested moment
  */
class BasePostgresReader(client: JdbcClient, dbName: String, tblName: String) {

  protected def toColumns(colNames: Seq[String], colTypes: Seq[String]): Seq[Column] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::toColumns") {
      colNames.zip(colTypes).map {
        case (colName, colType) =>
          colType match {
            case t if isLong(t)     => Int64Column(colName, colName, isNullable = true)
            case t if isInt(t)      => Int32Column(colName, colName, isNullable = true)
            case t if isDouble(t)   => DoubleColumn(colName, colName, isNullable = true)
            case t if isFloat(t)    => FloatColumn(colName, colName, isNullable = true)
            case t if isString(t)   => StringColumn(colName, colName, isNullable = true)
            case t if isBoolean(t)  => BoolColumn(colName, colName, isNullable = true)
            case t if isDate(t)     => DateColumn(colName, colName, isNullable = true)
            case t if isDateTime(t) => DateTime64Column(colName, colName, isNullable = true)
            case t if isDecimal(t)  => Int64Column(colName, colName, isNullable = true)
            case _                  => throw new UnsupportedOperationException(s"postgres type not supported: $colType")
          }
      }
    }

  protected def getMetaData(rs: ResultSet): (Array[String], Array[String]) =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getMetaData") {
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

  protected def toRecords(rs: ResultSet): Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::toRecords") {
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
          case t if isLong(t)     => rs.getLong(colName)
          case t if isInt(t)      => rs.getInt(colName)
          case t if isDouble(t)   => rs.getDouble(colName)
          case t if isFloat(t)    => rs.getFloat(colName)
          case t if isString(t)   => rs.getString(colName)
          case t if isBoolean(t)  => rs.getBoolean(colName)
          case t if isDate(t)     => rs.getDate(colName)
          case t if isDateTime(t) => rs.getTimestamp(colName)
          case t if isDecimal(t)  => rs.getBigDecimal(colName)
          case _                  => throw new UnsupportedOperationException(s"postgres data type not supported: $colType")
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
    colType.toLowerCase.contains("char") || colType.toLowerCase.contains("text") ||
    colType.toLowerCase.contains("uuid") || colType.toLowerCase.contains("enum") || colType.toLowerCase.contains("json")
  }

  protected def isInt(colType: String): Boolean = {
    colType.toLowerCase.contains("int") || colType.toLowerCase.contains("serial")
  }

  protected def isByte(colType: String): Boolean = {
    colType.toLowerCase.contains("bytea")
  }

  protected def isLong(colType: String): Boolean = {
    colType.toLowerCase.contains("bigint") || colType.toLowerCase.contains("money")
  }

  protected def isFloat(colType: String): Boolean = {
    colType.toLowerCase.contains("real") || colType.toLowerCase.contains("float")
  }

  protected def isDate(colType: String): Boolean = {
    colType.toLowerCase.contains("date")
  }

  protected def isDateTime(colType: String): Boolean = {
    colType.toLowerCase.contains("timestamp") || colType.toLowerCase.contains("time")
  }

  protected def isDouble(colType: String): Boolean = {
    colType.toLowerCase.contains("double") || colType.toLowerCase.contains("numeric")
  }

  protected def isBoolean(colType: String): Boolean = {
    colType.toLowerCase.contains("bool")
  }

  protected def isDecimal(colType: String): Boolean = {
    colType.toLowerCase.contains("decimal")
  }
}

/**
  * simply get data by using sql limit, offset
  * don't use this class concurrently, create new instance before use
  * @param client Postgres client
  * @param dbName name of db
  * @param tblName name of table
  * @param offset last synced offset
  * @param batchSize fetch size
  */
class SimplePostgresReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BasePostgresReader(client = client, dbName = dbName, tblName = tblName)
    with JdbcReader {

  private val FETCH_SIZE: Int = ZConfig.getInt("jdbc_worker.postgres.jdbc_fetch_size", 10000)

  private val SELECT_ALL_SQL = s"select * from $dbName.$tblName"
  private val SELECT_TOTAL_SQL = s"select count(1) from $dbName.$tblName"
  private val SAMPLE_SELECT_ALL_SQL = s"select * from $dbName.$tblName limit 1"

  /* https://jdbc.postgresql.org/documentation/head/query.html#query-with-cursor */
  private val conn: Connection = client.getConnection()
  conn.setAutoCommit(false)
  conn.setReadOnly(true)

  private val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(FETCH_SIZE)

  lazy private val rs: ResultSet = stmt.executeQuery(SELECT_ALL_SQL)

  private var numReadRows: Long = 0
  lazy private val totalRows: Long = getTotal()
  lazy private val (colNames, colTypes) = getColNamesAndTypes()

  override def getTableSchema: TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      client.executeQuery(SAMPLE_SELECT_ALL_SQL)(rs => toTableSchema(rs))
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
      client.executeQuery(SAMPLE_SELECT_ALL_SQL)(getMetaData)
    }

}

/**
  * simply get data by using sql limit, offset
  * don't use this class concurrently, create new instance before use
  * @param client Postgres client
  * @param dbName name of db
  * @param tblName name of table
  * @param incrementalColName column which always increase or decrease when new record inserted
  * @param lowerBound last synced value of incremental col
  * @param batchSize fetch size
  */
class IncrementalPostgresReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BasePostgresReader(
      client = client,
      dbName = dbName,
      tblName = tblName
    )
    with IncrementalColumnReader {

  override def buildUpperBoundQuery(): String = {
    s"""
       |select $incrementalColName
       |from $dbName.$tblName
       |where $incrementalColName >= ${toValue(lowerBound)}
       |order by $incrementalColName desc
       |limit 1;
       |""".stripMargin
  }

  override def buildQueryByRange(lowerBound: String, upperBound: String): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |where $incrementalColName > ${toValue(lowerBound)} and $incrementalColName <= ${toValue(upperBound)}
       |order by $incrementalColName asc
       |limit $batchSize;
       |""".stripMargin
  }

  override def buildQueryByValue(currentValue: String, offset: Int): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |where $incrementalColName = ${toValue(currentValue)}
       |limit $batchSize
       |offset $offset;
       |""".stripMargin
  }

  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}

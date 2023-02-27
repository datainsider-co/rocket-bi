package datainsider.jobworker.repository.reader

import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.{JdbcJob, JdbcSource}
import datainsider.jobworker.repository.{IncrementalColumnReader, JdbcReader, SimpleReader}
import datainsider.jobworker.util.ZConfig

import java.sql.{Connection, DriverManager, ResultSet, Statement, Timestamp}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

object MySqlReader {
  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int = 1000): JdbcReader = {
    val client: JdbcClient =
      NativeJdbcClient(source.jdbcUrl, source.username, source.password)
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalMySqlReader(
          client,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query
        )
      case None =>
        new SimpleMySqlReader(client, job.databaseName, job.tableName, batchSize, job.query)
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
class BaseMySqlReader(dbName: String, tblName: String) {

  protected def toColumns(colNames: Seq[String], colTypes: Seq[String]): Seq[Column] = {
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
          case t if isTime(t)     => DateTimeColumn(colName, colName, isNullable = true)
          case t if isDateTime(t) => DateTimeColumn(colName, colName, isNullable = true)
          case t if isDecimal(t)  => DoubleColumn(colName, colName, isNullable = true)
          case _                  => throw new UnsupportedOperationException(s"mysql type not supported: $colType")
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
      val row: Record = toRecord(rs, colNames, colTypes)
      rows += row
    }
    rows
  }

  protected def toRecord(rs: ResultSet, colNames: Seq[String], colTypes: Seq[String]): Record = {
    val row = ArrayBuffer.empty[Any]
    colNames.zip(colTypes).foreach {
      case (colName, colType) =>
        val item = colType match {
          case t if isLong(t)     => Try(rs.getLong(colName)).getOrElse(null)
          case t if isInt(t)      => Try(rs.getInt(colName)).getOrElse(null)
          case t if isDouble(t)   => Try(rs.getDouble(colName)).getOrElse(null)
          case t if isFloat(t)    => Try(rs.getFloat(colName)).getOrElse(null)
          case t if isString(t)   => Try(rs.getString(colName)).getOrElse(null)
          case t if isBoolean(t)  => Try(rs.getBoolean(colName)).getOrElse(null)
          case t if isDate(t)     => Try(rs.getDate(colName)).getOrElse(null)
          case t if isDateTime(t) => Try(rs.getTimestamp(colName)).getOrElse(null)
          case t if isTime(t)     => Try(new Timestamp(rs.getTime(colName).getTime)).getOrElse(null)
          case t if isDecimal(t)  => Try(rs.getBigDecimal(colName)).getOrElse(null)
          case _                  => throw new UnsupportedOperationException(s"mysql data type not supported: $colType")
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
    colType.toLowerCase.contains("char") || colType.toLowerCase.contains("text") || colType.toLowerCase.contains("enum")
  }

  protected def isInt(colType: String): Boolean = {
    colType.toLowerCase.contains("int")
  }

  protected def isByte(colType: String): Boolean = {
    colType.toLowerCase.contains("blob") || colType.toLowerCase.contains("binary")
  }

  protected def isLong(colType: String): Boolean = {
    colType.toLowerCase.contains("bigint")
  }

  protected def isFloat(colType: String): Boolean = {
    colType.toLowerCase.contains("float")
  }

  protected def isDate(colType: String): Boolean = {
    colType.toLowerCase.contains("date")
  }

  protected def isDateTime(colType: String): Boolean = {
    colType.toLowerCase.contains("datetime") || colType.toLowerCase.contains("timestamp")
  }

  protected def isDouble(colType: String): Boolean = {
    colType.toLowerCase.contains("double")
  }

  protected def isBoolean(colType: String): Boolean = {
    colType.toLowerCase.contains("bit")
  }

  protected def isTime(colType: String): Boolean = {
    colType.toLowerCase.contains("time") && !isDateTime(colType)
  }

  protected def isDecimal(colType: String): Boolean = {
    colType.toLowerCase.contains("decimal")
  }
}

/**
  * simply get data by using sql limit, offset
  * don't use this class concurrently, create new instance before use
  * @param client jdbc client
  * @param dbName name of db
  * @param tblName name of table
  * @param batchSize fetch size
  */
class SimpleMySqlReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseMySqlReader(dbName = dbName, tblName = tblName)
    with JdbcReader {

  val total: Long = getTotal()
  var numberReadRows: Long = 0

  val conn: Connection = client.getConnection()
  val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(Integer.MIN_VALUE)

  val rs: ResultSet = getDataResultSet(stmt)

  override def getTableSchema: TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      toTableSchema(rs)
    }

  override def next: Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      var count: Int = 0
      val rows = ArrayBuffer.empty[Record]
      val (colNames, colTypes) = getMetaData(rs)

      while (count < batchSize) {
        if (rs.next()) {
          val row: Record = toRecord(rs, colNames, colTypes)
          rows += row
        }

        count = count + 1
      }

      numberReadRows = numberReadRows + count
      rows
    }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      numberReadRows < total
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      numberReadRows.toString
    }

  private def getDataResultSet(statement: Statement): ResultSet =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getDataResultSet") {
      val query: String =
        s"""
         |select *
         |from $dbName.$tblName
         |""".stripMargin

      statement.executeQuery(query)
    }

  private def getTotal(): Long =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTotal") {
      val query =
        s"""
         |select count(*)
         |from $dbName.$tblName
         |""".stripMargin

      client.executeQuery(query)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    }

  /**
    * close client connection if
    */
  override def closeConnection(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::closeConnection") {
      rs.close()
      stmt.close()
      conn.close()
    }
}

/**
  * simply get data by using sql limit, offset
  * don't use this class concurrently, create new instance before use
  * @param client mysql client
  * @param dbName name of db
  * @param tblName name of table
  * @param incrementalColName column which always increase or decrease when new record inserted
  * @param lowerBound last synced value of incremental col
  * @param batchSize fetch size
  */
class IncrementalMySqlReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseMySqlReader(
      dbName = dbName,
      tblName = tblName
    )
    with IncrementalColumnReader {

  override def buildUpperBoundQuery(): String = {
    queryStatement match {
      case Some(value) => rebuildUpperBoundQuery(value)
      case None =>
        s"""
           |select $incrementalColName
           |from $dbName.$tblName
           |where $incrementalColName >= ${toValue(lowerBound)}
           |order by $incrementalColName desc
           |limit 1;
           |""".stripMargin
    }
  }

  protected def rebuildUpperBoundQuery(query: String): String = {
    var normalizeQuery = query.replaceAll(";", "")
    normalizeQuery = MySqlUpdateQueryUtils().removeStatement(normalizeQuery, "(L|l)(I|i)(M|m)(I|i)(T|t) ".r)
    normalizeQuery = MySqlUpdateQueryUtils().removeStatement(query, "(O|o)(R|r)(D|d)(E|e)(r|R) (B|b)(Y|y) ".r)
    normalizeQuery + s" order by $incrementalColName desc " + " limit 1 "
  }

  override def buildQueryByRange(lowerBound: String, upperBound: String): String = {
    queryStatement match {
      case Some(value) =>
        MySqlUpdateQueryUtils().rebuildQueryByRange(value, lowerBound, upperBound, incrementalColName, batchSize)
      case None =>
        s"""
           |select *
           |from $dbName.$tblName
           |where $incrementalColName > ${toValue(lowerBound)} && $incrementalColName <= ${toValue(upperBound)}
           |order by $incrementalColName asc
           |limit $batchSize;
           |""".stripMargin
    }
  }

  override def buildQueryByValue(currentValue: String, offset: Int): String = {
    queryStatement match {
      case Some(value) =>
        MySqlUpdateQueryUtils().rebuildQueryByValue(value, currentValue, offset, incrementalColName, batchSize)
      case None =>
        s"""
           |select *
           |from $dbName.$tblName
           |where $incrementalColName = ${toValue(currentValue)}
           |limit $batchSize
           |offset $offset;
           |""".stripMargin
    }
  }

  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}

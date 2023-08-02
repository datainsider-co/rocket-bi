package co.datainsider.jobworker.repository.reader.sqlserver

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.jobworker.domain.JdbcJob
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.repository.{IncrementalColumnReader, JdbcReader, SimpleReader}
import com.twitter.inject.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

object SqlServerReader {
  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int, fetchSize: Int = 10000): JdbcReader = {
    val client: JdbcClient = NativeJDbcClient(source.jdbcUrl, source.username, source.password)
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalSqlServerReader2(
          client,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query,
          fetchSize
        )
      case None =>
        new SqlServerReaderImpl(
          client,
          job.databaseName,
          job.tableName,
          job.lastSyncedValue.toInt,
          batchSize,
          job.query,
          fetchSize
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
@deprecated("use BaseSqlServerReader instead")
class AbstractSqlServerReader(client: JdbcClient, dbName: String, tblName: String) extends Logging {

  protected def toColumns(colNames: Seq[String], colTypes: Seq[String]): Seq[Column] = {
    colNames.zip(colTypes).map {
      case (colName, colType) =>
        colType match {
          case t if isLong(t)    => Int64Column(colName, colName, isNullable = true)
          case t if isInt(t)     => Int32Column(colName, colName, isNullable = true)
          case t if isDouble(t)  => DoubleColumn(colName, colName, isNullable = true)
          case t if isFloat(t)   => FloatColumn(colName, colName, isNullable = true)
          case t if isString(t)  => StringColumn(colName, colName, isNullable = true)
          case t if isBoolean(t) => BoolColumn(colName, colName, isNullable = true)
          case t if isDate(t)    => DateTimeColumn(colName, colName, isNullable = true)
          case t if isTime(t)    => DateTimeColumn(colName, colName, isNullable = true)
          case t if isDecimal(t) => Int64Column(colName, colName, isNullable = true)
          case _ =>
            logger.warn(s"mssql datatype not supported: $colType")
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
      val row = ArrayBuffer.empty[Any]
      colNames.zip(colTypes).foreach {
        case (colName, colType) =>
          val item = colType match {
            case t if isLong(t)    => rs.getLong(colName)
            case t if isInt(t)     => rs.getInt(colName)
            case t if isDouble(t)  => rs.getDouble(colName)
            case t if isFloat(t)   => rs.getFloat(colName)
            case t if isString(t)  => rs.getString(colName)
            case t if isBoolean(t) => rs.getBoolean(colName)
            case t if isDate(t)    => rs.getTimestamp(colName)
            case t if isTime(t)    => rs.getTime(colName)
            case t if isDecimal(t) => rs.getBigDecimal(colName)
            case _ =>
              try {
                rs.getString(colName)
              } catch {
                case _: Throwable =>
                  logger.warn(s"mssql datatype not supported, $colName")
                  null
              }
          }
          row += item
      }
      rows += row.toArray
    }
    rows
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
    colType.toLowerCase.contains("date") || colType.toLowerCase.contains("datetime") || colType.toLowerCase.contains(
      "timestamp"
    )
  }

  protected def isDouble(colType: String): Boolean = {
    colType.toLowerCase.contains("real")
  }

  protected def isBoolean(colType: String): Boolean = {
    colType.toLowerCase.contains("bit")
  }

  protected def isTime(colType: String): Boolean = {
    colType.toLowerCase.contains("time")
  }

  protected def isDecimal(colType: String): Boolean = {
    colType.toLowerCase.contains("decimal")
  }
}

@deprecated("use SqlServerReaderImpl instead")
class SimpleSqlServerReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends AbstractSqlServerReader(client = client, dbName = dbName, tblName = tblName)
    with SimpleReader {

  override def buildGetTotalQuery: String = {
    s"""
       |select count(1)
       |from $dbName.$tblName;
       |""".stripMargin
  }

  override def buildNextBatchQuery(curRow: Int): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |order by (select null)
       |offset $curRow rows
       |fetch next $batchSize rows only;
       |""".stripMargin
  }
}

/**
  * query based on a column whose values always equal or greater than previous values
  * E.g: [1,1,1,1,2,2,2,3,3,4,4,5,6]
  * better performance because usage of index
  * don't use this class concurrently, create new instance before use
  * @param client mysql client
  * @param dbName name of db
  * @param tblName name of table
  * @param incrementalColName column which always increase or decrease when new record inserted
  * @param lowerBound last synced value of incremental col
  * @param batchSize fetch size
  */
@deprecated("use IncrementalSqlServerReader2 instead")
class IncrementalSqlServerReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends AbstractSqlServerReader(
      client = client,
      dbName = dbName,
      tblName = tblName
    )
    with IncrementalColumnReader {

  override def buildUpperBoundQuery(): String = {
    s"""
       |select top 1 $incrementalColName
       |from $dbName.$tblName
       |where $incrementalColName >= ${toValue(lowerBound)}
       |order by $incrementalColName desc;
       |""".stripMargin
  }

  override def buildQueryByRange(lowerBound: String, upperBound: String): String = {
    s"""
       |select top $batchSize *
       |from $dbName.$tblName
       |where $incrementalColName > ${toValue(lowerBound)} and $incrementalColName < ${toValue(upperBound)}
       |order by $incrementalColName;
       |""".stripMargin
  }

  override def buildQueryByValue(currentValue: String, offset: Int): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |where $incrementalColName = ${toValue(currentValue)}
       |order by (select null)
       |offset $offset rows
       |fetch next $batchSize rows only;
       |""".stripMargin
  }

  /** *
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

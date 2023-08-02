package co.datainsider.jobworker.repository.reader

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.domain.JdbcJob
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.repository.{IncrementalColumnReader, JdbcReader, SimpleReader}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

object RedshiftReader {
  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int): JdbcReader = {
    val client: JdbcClient = NativeJDbcClient(source.jdbcUrl, source.username, source.password)
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalRedshiftReader(
          client,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query
        )
      case None =>
        new SimpleRedshiftReader(
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

abstract class BaseRedshiftReader(client: JdbcClient, dbName: String, tblName: String) {

  protected def toColumns(nameTypePairs: Seq[(String, String)]): Seq[Column] = {
    nameTypePairs.map {
      case (colName, colType) =>
        colType match {
          case t if isLong(t)     => Int64Column(colName, colName, isNullable = true)
          case t if isInt(t)      => Int32Column(colName, colName, isNullable = true)
          case t if isDouble(t)   => DoubleColumn(colName, colName, isNullable = true)
          case t if isFloat(t)    => FloatColumn(colName, colName, isNullable = true)
          case t if isString(t)   => StringColumn(colName, colName, isNullable = true)
          case t if isBoolean(t)  => BoolColumn(colName, colName, isNullable = true)
          case t if isDateTime(t) => DateTime64Column(colName, colName, isNullable = true)
          case t if isTime(t)     => DateTimeColumn(colName, colName, isNullable = true)
          case t if isDate(t)     => DateColumn(colName, colName, isNullable = true)
          case t if isDecimal(t)  => Int64Column(colName, colName, isNullable = true)
          case _                  => throw new UnsupportedOperationException(s"mysql type not supported: $colType")
        }
    }
  }

  protected def getMetaData(rs: ResultSet): Seq[(String, String)] = {
    val metadata = rs.getMetaData
    val colCount = metadata.getColumnCount
    val nameTypePairs = ArrayBuffer.empty[(String, String)]
    for (i <- 1 to colCount) nameTypePairs += Tuple2(metadata.getColumnName(i), metadata.getColumnTypeName(i))
    nameTypePairs
  }

  protected def getQuerySchema(nameTypePairs: Seq[(String, String)]): TableSchema = {
    TableSchema(tblName, dbName, -1L, tblName, toColumns(nameTypePairs))
  }

  protected def toRecords(rs: ResultSet): Seq[Record] = {
    val rows = ArrayBuffer.empty[Record]
    val nameTypePairs: Seq[(String, String)] = getMetaData(rs)
    while (rs.next()) {
      val row = ArrayBuffer.empty[Any]
      nameTypePairs.foreach {
        case (colName, colType) =>
          val item = colType match {
            case t if isLong(t)     => rs.getLong(colName)
            case t if isInt(t)      => rs.getInt(colName)
            case t if isDouble(t)   => rs.getDouble(colName)
            case t if isFloat(t)    => rs.getFloat(colName)
            case t if isString(t)   => rs.getString(colName)
            case t if isBoolean(t)  => rs.getBoolean(colName)
            case t if isDateTime(t) => rs.getTimestamp(colName)
            case t if isTime(t)     => rs.getTime(colName)
            case t if isDate(t)     => rs.getDate(colName)
            case t if isDecimal(t)  => rs.getBigDecimal(colName)
            case _                  => throw new UnsupportedOperationException(s"redshift data type not supported: $colType")
          }
          row += item
      }
      rows += row.toArray
    }
    rows
  }

  protected def toTableSchema(rs: ResultSet): TableSchema = {
    val nameTypePairs: Seq[(String, String)] = getMetaData(rs)
    getQuerySchema(nameTypePairs)
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
    colType.toLowerCase.contains("bool")
  }

  protected def isTime(colType: String): Boolean = {
    colType.toLowerCase.contains("time")
  }

  protected def isDecimal(colType: String): Boolean = {
    colType.toLowerCase.contains("decimal")
  }
}

class SimpleRedshiftReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseRedshiftReader(client = client, dbName = dbName, tblName = tblName)
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
       |limit $batchSize
       |offset $curRow;
       |""".stripMargin
  }
}

class IncrementalRedshiftReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseRedshiftReader(
      client = client,
      dbName = dbName,
      tblName = tblName
    )
    with IncrementalColumnReader {

  override def buildUpperBoundQuery(): String = {
    s"""
       |select $incrementalColName
       |from $dbName.$tblName
       |where $incrementalColName >= '$lowerBound'
       |order by $incrementalColName desc
       |limit 1;
       |""".stripMargin
  }

  override def buildQueryByRange(lowerBound: String, upperBound: String): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |where $incrementalColName > '$lowerBound' and $incrementalColName <= '$upperBound'
       |order by $incrementalColName asc
       |limit $batchSize;
       |""".stripMargin
  }

  override def buildQueryByValue(currentValue: String, offset: Int): String = {
    s"""
       |select *
       |from $dbName.$tblName
       |where $incrementalColName = '$currentValue'
       |limit $batchSize
       |offset $offset;
       |""".stripMargin
  }
}

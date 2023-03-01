package datainsider.jobworker.repository.reader.sqlserver

import com.twitter.inject.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient
import datainsider.jobworker.client.JdbcClient.Record

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

/**
  * created 2022-11-22 10:49 AM
  *
  * @author tvc12 - Thien Vi
  */
class BaseSqlServerReader(client: JdbcClient, dbName: String, tblName: String) extends Logging {

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
            logger.info(s"mssql datatype not supported: name: ${colName} type: $colType")
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

  protected def toRecord(rs: ResultSet, colNames: Array[String], colTypes: Seq[String]): Record = {
    val row = ArrayBuffer.empty[Any]
    colNames.zip(colTypes).foreach {
      case (colName, colType) =>
        val colData = colType match {
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
                logger.info(s"mssql datatype not supported, $colName")
                null
            }
        }
        row += colData
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

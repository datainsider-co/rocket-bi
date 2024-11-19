package co.datainsider.bi.engine.vertica

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.TimeUtils
import co.datainsider.schema.domain.column._
import co.datainsider.common.client.domain.Implicits.VALUE_NULL
import co.datainsider.common.client.exception.UnsupportedError

import java.sql.{ResultSetMetaData, Types}
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

/**
  * created 2023-07-18 6:36 PM
  *
  * @author tvc12 - Thien Vi
  */
object VerticaUtils {

  val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss.SSS"
  val DATE_PATTERN = "yyyy-MM-dd"

  def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(toColumnDDL)
      .mkString(", ")
  }

  //https://www.vertica.com/docs/12.0.x/HTML/Content/Authoring/SQLReferenceManual/DataTypes/SQLDataTypes.htm
  def toColumnDDL(column: Column): String = {
    val dataType = column match {
      case _: BoolColumn       => "BOOLEAN"
      case _: Int8Column       => "BIGINT"
      case _: Int16Column      => "BIGINT"
      case _: Int32Column      => "BIGINT"
      case _: Int64Column      => "BIGINT"
      case _: UInt8Column      => "BIGINT"
      case _: UInt16Column     => "BIGINT"
      case _: UInt32Column     => "BIGINT"
      case _: UInt64Column     => "BIGINT"
      case _: FloatColumn      => "FLOAT"
      case _: DoubleColumn     => "FLOAT"
      case _: StringColumn     => "VARCHAR(65000)"
      case _: DateColumn       => "DATE"
      case _: DateTimeColumn   => "TIMESTAMP"
      case _: DateTime64Column => "TIMESTAMP"
      case _: NestedColumn     => "VARCHAR(65000)"
      case _: ArrayColumn      => "VARCHAR(65000)"
      case _                   => throw UnsupportedError(s"This column isn't supported: ${column.getClass.getName}")
    }
    if (column.isNullable) {
      s""" "${column.name}" ${dataType} NULL"""
    } else {
      s""" "${column.name}" ${dataType} NOT NULL"""
    }
  }

  def parseColumns(metaData: ResultSetMetaData): Seq[Column] = {
    val columns = ArrayBuffer[Column]()
    val columnCount: Int = metaData.getColumnCount
    for (i <- 1 to columnCount) {
      val columnName: String = metaData.getColumnName(i)
      val colIdType: Int = metaData.getColumnType(i)
      val isNullable: Boolean = metaData.isNullable(i) == ResultSetMetaData.columnNullable
      columns += toColumn(columnName, colIdType, isNullable)
    }
    columns
  }

  def toColumn(colName: String, colIdType: Int, isNullable: Boolean): Column = {
    colIdType match {
      case Types.BIT          => BoolColumn(colName, colName, isNullable = isNullable)
      case Types.BOOLEAN      => BoolColumn(colName, colName, isNullable = isNullable)
      case Types.TINYINT      => Int64Column(colName, colName, isNullable = isNullable)
      case Types.SMALLINT     => Int64Column(colName, colName, isNullable = isNullable)
      case Types.INTEGER      => Int64Column(colName, colName, isNullable = isNullable)
      case Types.BIGINT       => Int64Column(colName, colName, isNullable = isNullable)
      case Types.FLOAT        => FloatColumn(colName, colName, isNullable = isNullable)
      case Types.REAL         => DoubleColumn(colName, colName, isNullable = isNullable)
      case Types.DOUBLE       => DoubleColumn(colName, colName, isNullable = isNullable)
      case Types.NUMERIC      => DoubleColumn(colName, colName, isNullable = isNullable)
      case Types.DECIMAL      => DoubleColumn(colName, colName, isNullable = isNullable)
      case Types.DATE         => DateColumn(colName, colName, isNullable = isNullable)
      case Types.TIME         => DateTimeColumn(colName, colName, isNullable = isNullable)
      case Types.TIMESTAMP    => DateTimeColumn(colName, colName, isNullable = isNullable)
      case Types.NVARCHAR     => StringColumn(colName, colName, isNullable = isNullable)
      case Types.LONGNVARCHAR => StringColumn(colName, colName, isNullable = isNullable)
      case Types.CHAR         => StringColumn(colName, colName, isNullable = isNullable)
      case Types.VARCHAR      => StringColumn(colName, colName, isNullable = isNullable)
      case Types.LONGVARCHAR  => StringColumn(colName, colName, isNullable = isNullable)
      case Types.NCHAR        => StringColumn(colName, colName, isNullable = isNullable)
      case Types.ARRAY        => StringColumn(colName, colName, isNullable = isNullable)
      case _                  => StringColumn(colName, colName, isNullable = isNullable)
    }
  }

  def normalizeToCorrespondingType(columns: Seq[Column], record: Record): Record = {
    columns
      .zip(record)
      .map {
        case (_: StringColumn, "") => ""
        // date, date time, int, uint, bool column value will convert to null, if value is empty
        case (_: Column, "")         => null
        case (_: Column, VALUE_NULL) => null
        case (_: Column, null)       => null

        case (col: DateTimeColumn, value)   => Try(toDateTime(value)).getOrElse(null)
        case (col: DateTime64Column, value) => Try(toDateTime(value)).getOrElse(null)
        case (col: DateColumn, value)       => Try(toDate(value)).getOrElse(null)

        case (_: Column, value) => value
      }.toArray
  }

  private def toDateTime(value: Any): String = {
    value match {
      case value: java.sql.Date      => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: java.sql.Timestamp => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: String             => value
      case value: Int                => TimeUtils.format(value, DATE_TIME_PATTERN)
      case value: Long               => TimeUtils.format(value, DATE_TIME_PATTERN)
      case _                         => null
    }
  }

  private def toDate(value: Any): String = {
    value match {
      case value: java.sql.Date      => TimeUtils.format(value.getTime, DATE_PATTERN)
      case value: java.sql.Timestamp => TimeUtils.format(value.getTime, DATE_PATTERN)
      case value: String             => value
      case value: Int                => TimeUtils.format(value, DATE_PATTERN)
      case value: Long               => TimeUtils.format(value, DATE_PATTERN)
      case _                         => null
    }
  }
}

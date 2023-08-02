package co.datainsider.jobworker.util

import co.datainsider.schema.domain.column._
import datainsider.client.exception.UnsupportedError

import java.sql.{JDBCType, ResultSet, ResultSetMetaData}
import scala.collection.mutable.ArrayBuffer

object JdbcUtils {
  def getColumnsFromResultSet(rs: ResultSet): Seq[Column] = {
    val meta = rs.getMetaData
    val columns = ArrayBuffer.empty[Column]
    for (i <- 1 to meta.getColumnCount) {
      val columnName: String = meta.getColumnName(i)
      val isNullable: Boolean = ResultSetMetaData.columnNoNulls != meta.isNullable(i)
      val columnType: Int = meta.getColumnType(i)
      val column: Column = JDBCType.valueOf(columnType) match {
        case JDBCType.BIT                      => Int8Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.TINYINT                  => Int8Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.SMALLINT                 => Int16Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.INTEGER                  => Int32Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.BIGINT                   => Int64Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.FLOAT                    => FloatColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.REAL                     => DoubleColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.DOUBLE                   => DoubleColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.NUMERIC                  => Int64Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.DECIMAL                  => Int64Column(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.CHAR                     => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.VARCHAR                  => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.LONGVARCHAR              => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.DATE                     => DateColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.TIME                     => DateTimeColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.TIMESTAMP                => DateTimeColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.BINARY                   => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.VARBINARY                => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.LONGVARBINARY            => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.NULL                     => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.OTHER                    => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.JAVA_OBJECT              => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.DISTINCT                 => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.STRUCT                   => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.ARRAY                    => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.BLOB                     => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.CLOB                     => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.REF                      => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.DATALINK                 => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.BOOLEAN                  => BoolColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.ROWID                    => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.NCHAR                    => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.NVARCHAR                 => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.LONGNVARCHAR             => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.NCLOB                    => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.SQLXML                   => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.REF_CURSOR               => StringColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.TIME_WITH_TIMEZONE       => DateTimeColumn(name = columnName, displayName = columnName, isNullable = isNullable)
        case JDBCType.TIMESTAMP_WITH_TIMEZONE  => DateTimeColumn(name = columnName, displayName = columnName, isNullable = isNullable)
      }
      columns += column
    }
    columns
  }

  def getSQLDataTypeExpr(column: Column): String = {
    val dataType = column match {
      case column: BoolColumn   => "UInt8"
      case column: Int8Column   => "Int8"
      case column: Int16Column  => "Int16"
      case column: Int32Column  => "Int32"
      case column: Int64Column  => "Int64"
      case column: UInt8Column  => "UInt8"
      case column: UInt16Column => "UInt16"
      case column: UInt32Column => "UInt32"
      case column: UInt64Column => "UInt64"
      case column: FloatColumn  => "Float32"
      case column: DoubleColumn => "Float64"
      case column: StringColumn => "String"
      case column: DateColumn   => "Date"
      case column: DateTimeColumn =>
        if (column.timezone.isDefined)
          s"DateTime('${column.timezone.getOrElse("")}')"
        else
          s"DateTime"
      case column: DateTime64Column =>
        if (column.timezone.isDefined)
          s"DateTime64(3,'${column.timezone.getOrElse("")}')"
        else
          s"DateTime64(3)"
      case arrayColumn: ArrayColumn => s"Array(${getSQLDataTypeExpr(arrayColumn.column)})"
      case column: NestedColumn     => "Nested"
      case _                        => throw UnsupportedError(s"This column isn't supported: ${column.getClass.getName}")
    }

    (column.isNullable, column) match {
      case (false, _)              => dataType
      case (true, _: ArrayColumn)  => dataType
      case (true, _: NestedColumn) => dataType
      case _                       => s"Nullable($dataType)"
    }
  }
}

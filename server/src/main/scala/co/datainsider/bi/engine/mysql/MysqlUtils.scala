package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.TimeUtils
import co.datainsider.schema.domain.column._
import com.mysql.cj.MysqlType
import co.datainsider.common.client.domain.Implicits.VALUE_NULL

import java.sql.ResultSetMetaData
import java.util.Date
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

/**
  * created 2023-06-29 10:21 AM
  *
  * @author tvc12 - Thien Vi
  */
object MysqlUtils {
  val DATE_PATTERN = "yyyy-MM-dd"
  val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss"

  def parseColumns(metaData: ResultSetMetaData): Seq[Column] = {
    val columns = ArrayBuffer[Column]()
    val columnCount: Int = metaData.getColumnCount
    for (i <- 1 to columnCount) {
      val columnName: String = metaData.getColumnLabel(i)
      val columnType: MysqlType = MysqlType.getByJdbcType(metaData.getColumnType(i))
      val isNullable: Boolean = metaData.isNullable(i) == ResultSetMetaData.columnNullable
      columns += toColumn(columnName, columnType, isNullable)
    }
    columns
  }

  def toColumn(
      columnName: String,
      columnType: MysqlType,
      isNullable: Boolean,
      defaultValue: Option[String] = None
  ): Column = {
    columnType match {
      case MysqlType.BIT | MysqlType.BOOLEAN =>
        BoolColumn(columnName, columnName, defaultValue = toBoolean(defaultValue), isNullable = isNullable)
      case MysqlType.TINYINT =>
        Int8Column(columnName, columnName, defaultValue = toByte(defaultValue), isNullable = isNullable)
      case MysqlType.SMALLINT =>
        Int16Column(columnName, columnName, defaultValue = toShort(defaultValue), isNullable = isNullable)
      case MysqlType.INT =>
        Int32Column(columnName, columnName, defaultValue = toInt(defaultValue), isNullable = isNullable)
      case MysqlType.BIGINT =>
        Int64Column(columnName, columnName, defaultValue = toLong(defaultValue), isNullable = isNullable)
      case MysqlType.FLOAT | MysqlType.FLOAT_UNSIGNED =>
        FloatColumn(columnName, columnName, defaultValue = toFloat(defaultValue), isNullable = isNullable)
      case MysqlType.DOUBLE | MysqlType.DOUBLE_UNSIGNED =>
        DoubleColumn(columnName, columnName, defaultValue = toDouble(defaultValue), isNullable = isNullable)
      case MysqlType.DECIMAL | MysqlType.DECIMAL_UNSIGNED =>
        DoubleColumn(columnName, columnName, defaultValue = toDouble(defaultValue), isNullable = isNullable)
      case MysqlType.DATE =>
        DateColumn(columnName, columnName, defaultValue = toDate(defaultValue).map(_.getTime), isNullable = isNullable)
      case MysqlType.DATETIME | MysqlType.TIMESTAMP | MysqlType.TIME =>
        DateTimeColumn(columnName, columnName, defaultValue = toDateTime(defaultValue), isNullable = isNullable)
      case MysqlType.TINYINT_UNSIGNED =>
        UInt8Column(columnName, columnName, defaultValue = toShort(defaultValue), isNullable = isNullable)
      case MysqlType.SMALLINT_UNSIGNED =>
        UInt16Column(columnName, columnName, defaultValue = toInt(defaultValue), isNullable = isNullable)
      case MysqlType.INT_UNSIGNED =>
        UInt32Column(columnName, columnName, defaultValue = toLong(defaultValue), isNullable = isNullable)
      case MysqlType.BIGINT_UNSIGNED =>
        UInt64Column(columnName, columnName, defaultValue = toBigInt(defaultValue), isNullable = isNullable)
      case _ => StringColumn(columnName, columnName, defaultValue = defaultValue, isNullable = isNullable)
    }
  }

  private def toBoolean(defaultValue: Option[String]): Option[Boolean] = {
    defaultValue match {
      case Some(value) => Try(value.toBoolean).toOption
      case None        => None
    }
  }

  private def toByte(defaultValue: Option[String]): Option[Byte] = {
    defaultValue match {
      case Some(value) => Try(value.toByte).toOption
      case None        => None
    }
  }

  private def toShort(defaultValue: Option[String]): Option[Short] = {
    defaultValue match {
      case Some(value) => Try(value.toShort).toOption
      case None        => None
    }
  }

  private def toInt(defaultValue: Option[String]): Option[Int] = {
    defaultValue match {
      case Some(value) => Try(value.toInt).toOption
      case None        => None
    }
  }

  private def toLong(defaultValue: Option[String]): Option[Long] = {
    defaultValue match {
      case Some(value) => Try(value.toLong).toOption
      case None        => None
    }
  }

  private def toBigInt(defaultValue: Option[String]): Option[BigInt] = {
    defaultValue match {
      case Some(value) => Try(BigInt(value)).toOption
      case None        => None
    }
  }

  private def toFloat(defaultValue: Option[String]): Option[Float] = {
    defaultValue match {
      case Some(value) => Try(value.toFloat).toOption
      case None        => None
    }
  }

  private def toDouble(defaultValue: Option[String]): Option[Double] = {
    defaultValue match {
      case Some(value) => Try(value.toDouble).toOption
      case None        => None
    }
  }

  private def toDate(defaultValue: Option[String]): Option[Date] = {
    defaultValue match {
      case Some(value) => Try(TimeUtils.parseAsDate(value, DATE_PATTERN)).toOption
      case None        => None
    }
  }

  private def toDateTime(defaultValue: Option[String]): Option[Long] = {
    defaultValue match {
      case Some(value) => Try(TimeUtils.parse(value, DATE_TIME_PATTERN)).toOption
      case None        => None
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

        case (col: DateTimeColumn, value)   => Try(parseDateTime(value)).getOrElse(null)
        case (col: DateTime64Column, value) => Try(parseDateTime(value)).getOrElse(null)
        case (col: DateColumn, value)       => Try(parseToDate(value)).getOrElse(null)

        case (_: Column, value) => value
      }
      .toArray
  }

  private def parseDateTime(value: Any): String = {
    value match {
      case value: java.sql.Date      => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: java.sql.Timestamp => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: String             => value
      case value: Int                => TimeUtils.format(value, DATE_TIME_PATTERN)
      case value: Long               => TimeUtils.format(value, DATE_TIME_PATTERN)
      case _                         => null
    }
  }

  private def parseToDate(value: Any): String = {
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

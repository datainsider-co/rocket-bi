package co.datainsider.bi.engine.redshift

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.TimeUtils
import co.datainsider.schema.domain.column._

import java.sql.{ResultSetMetaData, Timestamp}
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

/**
  * created 2023-06-29 10:21 AM
  *
  * @author tvc12 - Thien Vi
  */
object RedshiftUtils {
  private val DATE_PATTERN = "yyyy-MM-dd"
  private val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss"

  def parseColumns(metaData: ResultSetMetaData): Seq[Column] = {
    val columns = ArrayBuffer[Column]()
    val columnCount: Int = metaData.getColumnCount
    for (i <- 1 to columnCount) {
      val columnName: String = metaData.getColumnName(i)
      val columnType: String = metaData.getColumnTypeName(i)
      val isNullable: Boolean = metaData.isNullable(i) == ResultSetMetaData.columnNullable
      columns += toColumn(columnName, columnType, isNullable)
    }
    columns
  }

  def toColumn(
      columnName: String,
      columnType: String,
      isNullable: Boolean,
      defaultValue: Option[String] = None
  ): Column = {
    columnType match {
      case t if isLong(t) =>
        Int64Column(columnName, columnName, isNullable = isNullable, defaultValue = toLong(defaultValue))
      case t if isInt(t) =>
        Int32Column(columnName, columnName, isNullable = isNullable, defaultValue = toInt(defaultValue))
      case t if isDouble(t) =>
        DoubleColumn(columnName, columnName, isNullable = isNullable, defaultValue = toDouble(defaultValue))
      case t if isBool(t) =>
        BoolColumn(columnName, columnName, isNullable = isNullable, defaultValue = toBoolean(defaultValue))
      case t if isDateTime(t) =>
        DateTimeColumn(columnName, columnName, isNullable = isNullable, defaultValue = toDateTime(defaultValue))
      case t if isDate(t) =>
        DateColumn(columnName, columnName, isNullable = isNullable, defaultValue = toDate(defaultValue))
      case t if isString(t) =>
        StringColumn(columnName, columnName, isNullable = isNullable, defaultValue = defaultValue)
      case _ =>
        StringColumn(columnName, columnName, isNullable = isNullable, defaultValue = defaultValue)
    }
  }

  def toCorrespondingRecord(columns: Seq[Column], record: Record): Record = {
    record.zip(columns).map {
      case (null, _)                      => null
      case (value, _: DoubleColumn)       => Try(value.toString.toDouble).getOrElse(null)
      case (value, _: Int32Column)        => Try(value.toString.toInt).getOrElse(null)
      case (value, _: Int64Column)        => Try(value.toString.toLong).getOrElse(null)
      case (value, _: StringColumn)       => Try(value.toString).getOrElse(null)
      case (value, col: DateColumn)       => toDateTime(value, col.inputFormats.headOption.getOrElse(DATE_PATTERN))
      case (value, col: DateTimeColumn)   => toDateTime(value, col.inputFormats.headOption.getOrElse(DATE_TIME_PATTERN))
      case (value, col: DateTime64Column) => toDateTime(value, col.inputFormats.headOption.getOrElse(DATE_TIME_PATTERN))
      case (value, _)                     => value
    }
  }

  private def toDateTime(value: Any, dateTimePattern: String): Timestamp = {
    value match {
      case value: java.sql.Date      => new Timestamp(value.getTime)
      case value: java.sql.Timestamp => value
      case value: String             => new Timestamp(TimeUtils.parse(value, dateTimePattern))
      case value: Int                => new Timestamp(value)
      case value: Long               => new Timestamp(value)
      case _                         => null
    }
  }

  private def isLong(value: String): Boolean = {
    value.toLowerCase.contains("bigint")
  }

  private def isInt(value: String): Boolean = {
    value.toLowerCase.contains("int")
  }

  private def isDouble(value: String): Boolean = {
    value.toLowerCase.contains("double") || value.contains("float")
  }

  private def isString(value: String): Boolean = {
    value.toLowerCase.contains("char")
  }

  private def isDate(value: String): Boolean = {
    value.toLowerCase.contains("date")
  }

  private def isDateTime(value: String): Boolean = {
    value.toLowerCase.contains("time")
  }

  private def isBool(value: String): Boolean = {
    value.toLowerCase.contains("bool")
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

  private def toBigInt(defaultValue: Option[String]): Option[Long] = {
    defaultValue match {
      case Some(value) => Try(value.toLong).toOption
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

  private def toDate(defaultValue: Option[String]): Option[Long] = {
    defaultValue match {
      case Some(value) => Try(TimeUtils.parse(value, "yyyy-MM-dd")).toOption
      case None        => None
    }
  }

  private def toDateTime(defaultValue: Option[String]): Option[Long] = {
    defaultValue match {
      case Some(value) => Try(TimeUtils.parse(value, "yyyy-MM-dd HH:mm:ss")).toOption
      case None        => None
    }
  }
}

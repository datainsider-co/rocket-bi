package co.datainsider.schema.misc.parser

import co.datainsider.schema.domain.column.{DateColumn, DateTime64Column, DateTimeColumn}
import co.datainsider.schema.misc.ClickHouseUtils.EpochTimeLike

import java.sql.{Date, Timestamp}

object DateTimeColumnParser {

  def parseDate(dateInStr: String, inputFormats: Seq[String], tz: Option[String] = None): Date = {
    def applyFormat(format: String, dateInStr: String) = {
      try {
        Some(new java.sql.Date(dateInStr.asMillisWithFormat(format, tz)))
      } catch {
        case _: Throwable => None
      }
    }

    if (inputFormats != null && inputFormats.nonEmpty) {
      inputFormats
        .map(applyFormat(_, dateInStr))
        .filter(_.isDefined)
        .map(_.get)
        .head
    } else {
      new java.sql.Date(dateInStr.asMillis(tz))
    }
  }

  def parseDateTime(dateTimeInStr: String, inputFormats: Seq[String], tz: Option[String] = None): Timestamp = {
    if (inputFormats != null && inputFormats.nonEmpty) {
      inputFormats
        .map { format =>
          try {
            Some(
              new Timestamp(dateTimeInStr.asMillisWithFormat(format, tz))
            )
          } catch {
            case _: Throwable => None
          }
        }
        .filter(_.isDefined)
        .map(_.get)
        .head
    } else {
      new java.sql.Timestamp(dateTimeInStr.asMillis(tz))
    }
  }

  private def toPrecisionTimestamp(epochTimestamp: Long): Timestamp = {
    new Timestamp(epochTimestamp)
  }
}

case class DateColumnParser(column: DateColumn) extends IColumnParser[DateColumn] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null    => column.defaultValue.map(time => new Date(time)).orNull
        case v: Int  => new java.sql.Date(v)
        case v: Long => new java.sql.Date(v)
        case _       => DateTimeColumnParser.parseDate(data.toString, column.inputFormats)
      }
    } finally {
      column.defaultValue.map(time => new Date(time)).orNull
    }
  }
}

case class DateTimeColumnParser(column: DateTimeColumn) extends IColumnParser[DateTimeColumn] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null    => column.defaultValue.map(time => new Timestamp(time)).orNull
        case v: Int  => new Timestamp(v)
        case v: Long => new Timestamp(v)
        case _ =>
          if (column.inputAsTimestamp) {
            new Timestamp(data.toString.toLong)
          } else {
            DateTimeColumnParser.parseDateTime(data.toString, column.inputFormats, column.timezone)
          }

      }
    } finally {
      column.defaultValue.map(time => new Timestamp(time)).orNull
    }
  }

}

case class DateTime64ColumnParser(column: DateTime64Column) extends IColumnParser[DateTime64Column] {

  override def parse(data: Any): Any = {
    try {
      data match {
        case null    => column.defaultValue.map(time => new Timestamp(time)).orNull
        case v: Int  => new Timestamp(v)
        case v: Long => new Timestamp(v)
        case _ =>
          if (column.inputAsTimestamp) {
            new Timestamp(data.toString.toLong)
          } else {
            DateTimeColumnParser.parseDateTime(data.toString, column.inputFormats, column.timezone)
          }
      }
    } finally {
      column.defaultValue.map(new Timestamp(_)).orNull
    }
  }
}

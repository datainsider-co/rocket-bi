package datainsider.jobworker.util

import datainsider.client.exception.BadRequestError

import java.sql.{Date, Timestamp}
import java.time.{LocalDate, LocalDateTime}
import java.time.format.DateTimeFormatter

object DateTimeUtils {

  def toSqlDate(dateAsStr: String): Date = {
    try {
      val localDate: LocalDate = LocalDate.parse(dateAsStr)
      Date.valueOf(localDate)
    } catch {
      case _: Throwable => throw BadRequestError(s"unable to parse date from str: $dateAsStr")
    }
  }

  def toSqlTimestamp(dataTimeAsStr: String): Timestamp = {
    try {
      val pattern = "yyyy-MM-dd HH:mm:ss"
      val formatter = DateTimeFormatter.ofPattern(pattern)
      val localDateTime = LocalDateTime.from(formatter.parse(dataTimeAsStr))
      Timestamp.valueOf(localDateTime)
    } catch {
      case _: Throwable => throw BadRequestError(s"unable to parse datetime from str: $dataTimeAsStr")
    }
  }
}

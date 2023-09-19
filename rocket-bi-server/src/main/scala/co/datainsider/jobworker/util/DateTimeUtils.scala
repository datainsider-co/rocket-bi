package co.datainsider.jobworker.util

import co.datainsider.bi.util.DateFormatter
import co.datainsider.jobworker.domain.RangeValue
import com.twitter.util.logging.Logging
import datainsider.client.exception.BadRequestError

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.time.format.DateTimeFormatter
import java.time.{LocalDate, LocalDateTime}
import scala.collection.mutable.ArrayBuffer

object DateTimeUtils extends Logging {

  private val LAST_N_DAYS_PATTERN = "last_(\\d+)_days".r

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

  /**
   * Format date to string with pattern
   */
  def formatDate(date: Date, pattern: String = "yyyy-MM-dd"): String = {
    val formatter = new SimpleDateFormat(pattern)
    formatter.format(date)
  }

  /**
    * Method split from date -> to date into window range
    * splitDate(2011-10-10, 2011-10-20, 4) => (2011-10-10, 2011-10-14), (2011-10-14, 2011-10-18), (2011-10-18, 2011-10-20)
    */
  def splitDateRanges(fromDate: Date, toDate: Date, windowDays: Int): Seq[RangeValue[Date]] = {
    require(windowDays > 0, "window days must be greater than 0")
    var fromLocalDate: LocalDate = fromDate.toLocalDate
    val toLocalDate: LocalDate = toDate.toLocalDate
    val dateRangeList = ArrayBuffer.empty[RangeValue[Date]]
    var isContinue = true
    do {
      val nextLocalDate: LocalDate = fromLocalDate.plusDays(windowDays)
      if (toLocalDate.isAfter(nextLocalDate)) {
        isContinue = true
        dateRangeList += RangeValue(Date.valueOf(fromLocalDate), Date.valueOf(nextLocalDate))
        fromLocalDate = nextLocalDate
      } else if (toLocalDate.isAfter(fromLocalDate)) {
        isContinue = false
        dateRangeList += RangeValue(Date.valueOf(fromLocalDate), toDate)
      } else {
        isContinue = false
      }
    } while (isContinue)
    dateRangeList
  }

  /**
    * parse date from text.
    * support format: yyyy-MM-dd, yesterday, today, last_N_days
    * @param dateAsText date as text
    * @return java.sql.Date
    */
  def parseToDate(dateAsText: String): Option[Date] =
    Option {
      try {
        if (dateAsText == "yesterday") {
          getYesterday()
        } else if (dateAsText == "today") {
          getToday()
        } else {
          LAST_N_DAYS_PATTERN.findFirstMatchIn(dateAsText) match {
            case Some(matcher) => {
              val nDays: Int = matcher.group(1).toInt
              getLastNDays(nDays)
            }
            case _ => toSqlDate(dateAsText)
          }
        }
      } catch {
        case _: Throwable =>
          logger.debug(s"unable to parse date from text: $dateAsText")
          null
      }
    }

  def getYesterday(): Date = {
    getLastNDays(1)
  }

  def getLastNDays(n: Int): Date = {
    val lastNDays: LocalDate = new Date(System.currentTimeMillis()).toLocalDate.minusDays(n)
    Date.valueOf(lastNDays)
  }

  def getToday(): Date = {
    val today: LocalDate = new Date(System.currentTimeMillis()).toLocalDate
    Date.valueOf(today)
  }

  def getNextDay(date: Date): Date = {
    val nextDay: LocalDate = date.toLocalDate.plusDays(1)
    Date.valueOf(nextDay)
  }
}

package co.datainsider.bi.util

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.time.temporal.ChronoField
import java.util.TimeZone
import co.datainsider.common.client.exception.NotFoundError

import java.time.format.{DateTimeFormatter => LocalTimeFormatter}
import java.time.{LocalDate, LocalDateTime, Month, ZoneId}
import java.util
import scala.math.{abs, log10, pow}

abstract class Formatter {
  def format(value: Object): Object
}

/** datetime value return from clickhouse jdbc: yyyy-MM-dd HH:mm:ss (only for clickhouse) */
object DateFormatter {
  def format(value: Object): Object = {
    try {
      val timestamp = Timestamp.valueOf(value.toString)
      val fmtr = new SimpleDateFormat("yyyy-MM-dd")
      fmtr.setTimeZone(TimeZone.getTimeZone("UTC"))
      fmtr.format(timestamp).asInstanceOf[Object]
    } catch {
      case _: Throwable => value
    }

  }
}

object DateTimeFormatter {

  private val formatter = LocalTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

  def format(value: Object): Object = {
    try {
      value.asInstanceOf[LocalDateTime].format(formatter)
    } catch {
      case _: Throwable => value
    }
  }
}

object DoubleFormatter {
  def format(value: Object, decimalNum: Int = 2): Object = {
    try {
      val rounded = BigDecimal(value.toString).setScale(decimalNum, BigDecimal.RoundingMode.HALF_UP)
      rounded.asInstanceOf[Object]
    } catch {
      case _: Throwable => value
    }
  }
}

object DayOfWeekFormatter {
  def format(value: Object): Object = {
    try {
      value.toString match {
        case "1" => "Monday"
        case "2" => "Tuesday"
        case "3" => "Wednesday"
        case "4" => "Thursday"
        case "5" => "Friday"
        case "6" => "Saturday"
        case "7" => "Sunday"
        case _   => throw NotFoundError(s"value day of week not found: $value")
      }
    } catch {
      case _: Throwable => value
    }
  }

  def deformat(value: Object): Object = {
    try {
      value.toString match {
        case "Monday"    => "1"
        case "Tuesday"   => "2"
        case "Wednesday" => "3"
        case "Thursday"  => "4"
        case "Friday"    => "5"
        case "Saturday"  => "6"
        case "Sunday"    => "7"
        case _           => throw NotFoundError(s"value day of week not found: $value")
      }
    } catch {
      case _: Throwable => value
    }
  }
}

object QuarterNumFormatter extends {
  def format(value: Object): Object = {
    try {
      val numQuarter = value.toString.toInt
      val year = numQuarter / 4
      val quarter = numQuarter % 4 + 1
      s"$year-Q$quarter"
    } catch {
      case _: Throwable => value
    }
  }

  def deformat(value: Object): Object = {
    try {
      val quarterReg = "(\\d{4})-Q(\\d)".r
      val num: Int = value.toString match {
        case quarterReg(year, quarter) => year.toInt * 4 + quarter.toInt - 1
        case _                         => throw NotFoundError(s"quarter num not found: $value")
      }
      num.toString
    } catch {
      case _: Throwable => value
    }
  }
}

object MonthNumFormatter {
  private val MONTHS = Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

  /**
    * @param value number from 1, starting from month 1 of year 0000
    * @return string value of month in pattern: yyyy-{m}, m in [Jan... Dec]
    */
  def format(value: Object): Object = {
    try {
      val numMonth = value.toString.toInt
      var year = numMonth / 12
      var month = numMonth % 12
      if (month == 0) {
        month = 12
        year -= 1
      }
      f"${year}%04d-${MONTHS(month - 1)}"
    } catch {
      case _: Throwable => value
    }
  }

  /**
    * @param value string value with format yyyy-<m>, m in {Jan, Feb... Dec}. E.g: 2020-Jan
    * @return
    */
  def deformat(value: Object): Object = {
    try {
      val monthRegex = "(\\d{4})-(\\w{3})".r
      val num: Int = value.toString match {
        case monthRegex(year, month) =>
          require(MONTHS.contains(month))

          val monthNum: Int = MONTHS.indexOf(month)
          year.toInt * 12 + monthNum.toInt + 1
        case _ => throw NotFoundError(s"month num pattern not found: $value")
      }
      num.toString
    } catch {
      case _: Throwable => value
    }
  }
}

object DayNumFormatter extends {

  /**
    * @param value date count starting from 0, since 1970-01-01
    * @return date string in pattern yyyy-MM-dd
    */
  def format(value: Object): Object = {
    try {
      val dayNum = value.toString.toLong
      val timestamp = new Timestamp(dayNum * 24 * 3600 * 1000)
      val date = new Date(timestamp.getTime)
      date
    } catch {
      case _: Throwable => value
    }
  }

  /**
    * @param value string value with format yyyy-MM-dd. E.g: 2022-01-01
    * @return
    */
  def deformat(value: Object): Object = {
    try {
      val dateFormat = new SimpleDateFormat("yyyy-MM-dd")
      dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"))
      val parsedDate: util.Date = dateFormat.parse(value.toString)
      val timestamp: Long = parsedDate.getTime

      val dayNum: Long = timestamp / (24 * 3600 * 1000)
      dayNum.asInstanceOf[Object]
    } catch {
      case _: Throwable => value
    }
  }
}

object WeekNumFormatter {

  val millisPerWeek: Long = (7 * 24 * 3600 * 1000)

  /**
    * @param value integer from 0, counting from 1970-01-01
    * @return week num string with pattern: yyyy-W{num}
    */
  def format(value: Object): Object = {
    try {
      val weekNum = value.toString.toLong
      val timestamp = new Timestamp(weekNum * millisPerWeek)
      val localDate = timestamp.toLocalDateTime.toLocalDate
      val week = localDate.get(ChronoField.ALIGNED_WEEK_OF_YEAR)
      val year = localDate.getYear
      s"$year-W$week"
    } catch {
      case _: Throwable => value
    }
  }

  /**
    * @param value input patter: yyyy-W{d}, d = {1,2,3,4...55}. E.g: 2020-W1
    * @return week num
    */
  def deformat(value: Object): Object = {
    try {
      val weekRegex = "(\\d{4})-W(\\d+)".r
      val num: Int = value.toString match {
        case weekRegex(year, week) =>
          val date = LocalDate.of(year.toInt, Month.JANUARY, 1)
          val instant = date.atStartOfDay(ZoneId.of("UTC")).toInstant
          val timestamp = Timestamp.from(instant).getTime

          val weekFromYear = (timestamp / millisPerWeek).toInt
          val isNewWeek = timestamp % millisPerWeek == 0

          weekFromYear + week.toInt - (if (isNewWeek) 1 else 0)
        case _ => throw NotFoundError(s"week num pattern not found: $value")
      }
      num.toString
    } catch {
      case _: Throwable => value
    }
  }
}

object HourNumFormatter {
  def format(value: Object): Object = {
    try {
      val hourNum = value.toString.toLong
      val timestamp = new Timestamp(hourNum * 3600 * 1000)
      val hour = timestamp.toLocalDateTime.getHour
      val date = new Date(timestamp.getTime)
      "%s %02d".format(date, hour)
    } catch {
      case _: Throwable => value
    }
  }
}

object MinuteNumFormatter {
  def format(value: Object): Object = {
    try {
      val minuteNum = value.toString.toLong
      val timestamp = new Timestamp(minuteNum * 60 * 1000)
      val localTime = timestamp.toLocalDateTime
      val hour = localTime.getHour
      val min = localTime.getMinute
      val date = new Date(timestamp.getTime)
      "%s %02d:%02d".format(date, hour, min)
    } catch {
      case _: Throwable => value
    }
  }
}

object SecondNumFormatter {
  def format(value: Object): Object = {
    try {
      val secondNum = value.toString.toLong
      val timestamp = new Timestamp(secondNum * 1000)
      val localTime = timestamp.toLocalDateTime
      val hour = localTime.getHour
      val min = localTime.getMinute
      val sec = localTime.getSecond
      val date = new Date(timestamp.getTime)
      "%s %02d:%02d:%02d".format(date, hour, min, sec)
    } catch {
      case _: Throwable => value
    }
  }
}

object QuarterFormatter {
  def format(value: Object): Object = {
    try {
      val quarter = value.toString.toInt
      s"Q$quarter"
    } catch {
      case _: Throwable => value
    }
  }

  def deformat(value: Object): Object = {
    try {
      val reg = "Q(\\d)".r
      val num: Int = value.toString match {
        case reg(quarter) => quarter.toInt
        case _            => throw NotFoundError(s"quarter num not found: $value")
      }
      num.toString
    } catch {
      case _: Throwable => value
    }
  }
}

object MonthFormatter {
  def format(value: Object): Object = {
    try {
      val monthArr = Array(
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      )
      val month = value.toString.toInt
      s"${monthArr(month - 1)}"
    } catch {
      case _: Throwable => value
    }
  }

  def deformat(value: Object): Object = {
    try {
      val month: Int = value.toString match {
        case "January"   => 1
        case "February"  => 2
        case "March"     => 3
        case "April"     => 4
        case "May"       => 5
        case "June"      => 6
        case "July"      => 7
        case "August"    => 8
        case "September" => 9
        case "October"   => 10
        case "November"  => 11
        case "December"  => 12
      }
      month.toString
    } catch {
      case _: Throwable => value
    }
  }
}

object PrettyNumberFormatter {
  def format(value: Object, decimalNum: Int = 0): Object = {
    try {
      val num = value.toString.toDouble
      val sign = if (num < 0) "-" else ""
      val absNum = abs(num)

      val numZeros = log10(absNum).floor
      if (numZeros >= 9) {
        val digit = absNum / pow(10.0, 9)
        s"${sign}%.${decimalNum}fB".format(digit)
      } else if (numZeros >= 6) {
        val digit = absNum / pow(10.0, 6)
        s"${sign}%.${decimalNum}fM".format(digit)
      } else {
        s"${sign}%.${decimalNum}f".format(absNum)
      }
    } catch {
      case _: Throwable => value
    }
  }
}

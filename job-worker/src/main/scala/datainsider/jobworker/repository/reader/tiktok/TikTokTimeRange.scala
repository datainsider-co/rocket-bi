package datainsider.jobworker.repository.reader.tiktok

import java.text.SimpleDateFormat
import java.time
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Calendar
import scala.collection.mutable.ArrayBuffer

/**
  * @param start yyyy-MM-dd
  * @param end yyyy-MM-dd
  */
case class TikTokTimeRange(start: String, end: String) {

  private val WINDOW_RANGE: Int = 30
  def isValid(): Boolean = {
    try {
      val startDate = time.LocalDate.parse(start)
      val endDate = time.LocalDate.parse(end)
      startDate.compareTo(endDate) < 0
    } catch {
      case _: DateTimeParseException => false
    }
  }

  def splitIntoMonth: Seq[TikTokTimeRange] = {
    var startDate = time.LocalDate.parse(start)
    val endDate = time.LocalDate.parse(end)
    val timerRanges = ArrayBuffer[TikTokTimeRange]()
    while (ChronoUnit.DAYS.between(startDate, endDate) > WINDOW_RANGE) {
      val nextDate = startDate.plusDays(WINDOW_RANGE)
      timerRanges.append(TikTokTimeRange(startDate.toString, nextDate.toString))
      startDate = nextDate.plusDays(1)
    }
    timerRanges.append(TikTokTimeRange(startDate.toString, endDate.toString))
    timerRanges
  }

}

case object TikTokTimeRange {

  val formatter = new SimpleDateFormat("yyyy-MM-dd")

  def getNextDate(curDate: String): String = {
    val calendar = Calendar.getInstance()
    calendar.setTime(formatter.parse(curDate))
    calendar.add(Calendar.DAY_OF_YEAR, 1)
    formatter.format(calendar.getTime)
  }

  /**
    * @param lastDate "yyyy-MM-dd"
    */
  // 365 day for default start time. Do not find any limit information for start_time and end_time on tiktok's doc
  @throws[DateTimeParseException]("last date format is not correct")
  def getTimeRanges(lastDate: Option[String]): Seq[TikTokTimeRange] = {
    val calendar = Calendar.getInstance()
    val toDate = formatter.format(calendar.getTime)
    if (lastDate.isEmpty) calendar.add(Calendar.DAY_OF_YEAR, -365)
    else {
      calendar.setTime(formatter.parse(lastDate.get))
    }
    val fromDate = formatter.format(calendar.getTime)
    TikTokTimeRange(fromDate, toDate).splitIntoMonth
  }
}

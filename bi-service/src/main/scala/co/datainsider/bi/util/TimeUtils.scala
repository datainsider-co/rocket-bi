package co.datainsider.bi.util

import java.text.SimpleDateFormat
import java.util.concurrent.TimeUnit
import java.util.{Calendar, TimeZone}
import scala.collection.mutable.ListBuffer

object TimeUtils {

  def durationToTomorrowCheckpoint(hour: Int, min: Int, tz: Option[TimeZone] = None): (Long, Long) = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.set(
      calendar.get(Calendar.YEAR),
      calendar.get(Calendar.MONTH),
      calendar.get(Calendar.DAY_OF_MONTH),
      hour,
      min,
      0
    )
    calendar.set(Calendar.MILLISECOND, 0)

    val currentTime = System.currentTimeMillis()
    if (currentTime > calendar.getTimeInMillis) {
      calendar.add(Calendar.DAY_OF_MONTH, 1)
    }
    (calendar.getTimeInMillis - currentTime, calendar.getTimeInMillis)
  }

  def calcTimeInCurrentDay(tz: Option[TimeZone] = None): (Long, Long) = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val start = calendar.getTimeInMillis
    calendar.add(Calendar.DAY_OF_MONTH, 1)
    val end = calendar.getTimeInMillis
    (start, end)
  }

  def calcBeginOfNextDayInMills(tz: Option[TimeZone] = None): Long = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.add(Calendar.DAY_OF_MONTH, 1)
    calendar.getTimeInMillis
  }

  def calcBeginOfSpecifiedDayInMills(diffFromCurrent: Int, tz: Option[TimeZone] = None): Long = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.add(Calendar.DAY_OF_MONTH, diffFromCurrent)
    calendar.getTimeInMillis
  }

  def calcBeginOfDayInMills(tz: Option[TimeZone] = None): (Long, String) = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val start = calendar.getTimeInMillis
    (
      start,
      f"${calendar.get(Calendar.DAY_OF_MONTH)}%02d-${calendar.get(Calendar.MONTH) + 1}%02d-${calendar.get(Calendar.YEAR)}%04d"
    )
  }

  def calcBeginOfDayInMillsFrom(mills: Long, tz: Option[TimeZone] = None): (Long, String) = {
    val calendar = tz.fold(Calendar.getInstance())(Calendar.getInstance(_))
    calendar.setTimeInMillis(mills)
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val start = calendar.getTimeInMillis
    (
      start,
      f"${calendar.get(Calendar.DAY_OF_MONTH)}%02d-${calendar.get(Calendar.MONTH) + 1}%02d-${calendar.get(Calendar.YEAR)}%04d"
    )
  }

  def getTimeStringFromMills(mills: Long): String = {
    val currentTime = Calendar.getInstance()
    currentTime.setTimeInMillis(mills)

    f"${currentTime.get(Calendar.DAY_OF_MONTH)}%02d-${currentTime.get(Calendar.MONTH) + 1}%02d-${currentTime.get(Calendar.YEAR)}%04d"
  }

  def extractTimeFromDatetime(time: Long): Long = {
    val (begin, _) = calcBeginOfDayInMillsFrom(time)
    time - begin
  }

  def parseMillsFromString(dateStr: String, pattern: String): Long = {
    val format = new SimpleDateFormat(pattern)
    format.parse(dateStr).getTime
  }

  def makeDayRange(from: Long, to: Long, dayInterval: Int = 1): Seq[(Long, String)] = {
    var (begin, beginStr) = calcBeginOfDayInMillsFrom(from)
    val buffer = ListBuffer.empty[(Long, String)]
    while (begin <= to) {
      if (begin >= from) {
        buffer.append((begin, beginStr))
      }
      val (time, timeStr) = calcBeginOfDayInMillsFrom(begin + TimeUnit.DAYS.toMillis(dayInterval))
      begin = time
      beginStr = timeStr
    }
    buffer.seq
  }

  //TODO: change percent. Current 60%
  def estimateNumberOfDay(duration: Long, durationOfEachStep: Long): Double = {
    //Step is 0.5
    val numStep = duration / durationOfEachStep
    val remain = duration - (numStep * durationOfEachStep)
    if (remain >= (0.6 * durationOfEachStep)) {
      (numStep + 1).doubleValue() / 2
    } else {
      numStep.doubleValue() / 2
    }
  }

  def convertToTimeZone(time: Long, tz: String): Long = {
    convertToTimeZone(time, TimeZone.getTimeZone(tz))
  }

  def convertToTimeZone(time: Long, tz: TimeZone): Long = {
    time + tz.getOffset(time)
  }

  def format(time: Long, pattern: String, tz: Option[TimeZone] = None): String = {
    val sdfmt = new SimpleDateFormat(pattern)
    tz.foreach(sdfmt.setTimeZone(_))
    sdfmt.format(time)
  }

  def parse(date: String, format: String, tz: Option[TimeZone] = None): Long = {
    val f = new SimpleDateFormat(format)
    tz match {
      case None    => f.setTimeZone(TimeZone.getDefault)
      case Some(x) => f.setTimeZone(x)
    }
    f.parse(date).getTime
  }

  def toPrettyDurationString(duration: Long): String = {
    val units = Array("days", "hours", "minutes", "seconds", "milliseconds")
    val metrics = Array(
      duration / 86400000,
      (duration % 86400000) / 3600000,
      ((duration % 86400000) % 3600000) / 60000,
      (((duration % 86400000) % 3600000) % 60000) / 1000,
      (((duration % 86400000) % 3600000) % 60000) % 1000
    )

    metrics
      .zip(units)
      .filterNot(_._1 <= 0)
      .map {
        case (metric, unit) => s"$metric $unit"
      }
      .mkString(", ")
  }

}

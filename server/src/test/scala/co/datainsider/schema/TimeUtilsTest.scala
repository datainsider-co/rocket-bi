package co.datainsider.schema

import co.datainsider.bi.util.TimeUtils
import com.twitter.inject.Test
import co.datainsider.common.client.util.JsonParser

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util.TimeZone

/**
  * @author andy
  */
class TimeUtilsTest extends Test {
  val datePattern = "dd/MM/yyyy HH:mm:ss.SSS"
  val utc7 = TimeZone.getTimeZone("Asia/Saigon")

  test("Get timezone list") {
    val tzIds = TimeZone.getAvailableIDs()
    val offsets = tzIds.map(id => TimeZone.getTimeZone(id).getRawOffset)

    val tzWithOffsetMap = tzIds.zip(offsets).toMap

    println(s"Timezone IDS: ${JsonParser.toJson(tzWithOffsetMap, true)}")
    assertResult(true)(tzIds.nonEmpty)
  }

  test("Parse current time to different timezone") {
    val tzIds = TimeZone.getAvailableIDs()
    val tzMap = tzIds.map(id => (id, TimeZone.getTimeZone(id))).toSeq.sortBy(_._2.getRawOffset)

    val (beginOfLocalTime, _) = TimeUtils.calcBeginOfDayInMills()
    val time = System.currentTimeMillis()
    val beginLocalTimeInStr = TimeUtils.format(beginOfLocalTime, "dd/MM/yyyy HH:mm:ss.SSS")
    val localTimeInStr = TimeUtils.format(time, "dd/MM/yyyy HH:mm:ss.SSS")
    val localTimezone = TimeZone.getDefault

    println(
      s"Default Local TimeZone:${localTimezone.getID} - ${localTimezone.getRawOffset} - ${localTimezone.getDisplayName} "
    )
    println(s"Local time: $time - $localTimeInStr ")
    println(s"Local time (Local Default TimeZone): $time - ${TimeUtils
      .format(time, "dd/MM/yyyy HH:mm:ss.SSS", Some(localTimezone))}")

    tzMap.foreach {
      case (id, zone) =>
        val beginTimeInStr = TimeUtils.format(beginOfLocalTime, "dd/MM/yyyy HH:mm:ss.SSS", Some(zone))
        val timeInStr = TimeUtils.format(time, "dd/MM/yyyy HH:mm:ss.SSS", Some(zone))
        println(s"Local day range  $beginLocalTimeInStr -> $beginTimeInStr in ${zone.getID} - ${zone.getRawOffset} ")
        println(s"Local time:  $time ")
        println(s"Local  $localTimeInStr -> $timeInStr in ${zone.getID} - ${zone.getRawOffset} ")

        val (localStart, localEnd) = TimeUtils.calcTimeInCurrentDay()
        val (zoneStart, zoneEnd) = TimeUtils.calcTimeInCurrentDay(Some(zone))

        println(
          s"Local: ($localStart - $localEnd) = (${TimeUtils.format(localStart, datePattern)} - ${TimeUtils.format(localEnd, datePattern)})"
        )
        println(
          s"($zoneStart - $zoneEnd) => (${TimeUtils.format(zoneStart, datePattern)} - ${TimeUtils
            .format(zoneEnd, datePattern)}) in UTC+0. Remain: ${TimeUtils
            .prettyTime(TimeUtils.durationToTomorrowCheckpoint(1, 0)._1)}"
        )
        println(
          s"($zoneStart - $zoneEnd) = (${TimeUtils.format(zoneStart, datePattern, Some(zone))} - ${TimeUtils
            .format(zoneEnd, datePattern, Some(zone))}) In Zone. Remain: ${TimeUtils
            .prettyTime(TimeUtils.durationToTomorrowCheckpoint(1, 0, Some(zone))._1)}"
        )

        println(
          s"($zoneStart - $zoneEnd) = (${TimeUtils.format(zoneStart, datePattern, Some(utc7))} - ${TimeUtils
            .format(zoneEnd, datePattern, Some(utc7))}) In Zone ${utc7.getDisplayName}. Remain: ${TimeUtils
            .prettyTime(TimeUtils.durationToTomorrowCheckpoint(1, 0, Some(utc7))._1)}"
        )

        println("------------")
    }

    assertResult(true)(tzIds.nonEmpty)
    assertResult(true)(tzMap.nonEmpty)
  }

  test("test parse time by format") {
    val dateStr = "2021-01-20 00:00:30"
    val formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val datetime = formatter.parse(dateStr)
    println(datetime)
    val timestamp = new Timestamp(datetime.getTime)
    println(timestamp)
  }

  private def parseDateTimeBestEffort(dateStr: String): Option[Timestamp] = {
    val commonDateFormats = Seq(
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd",
      "yy-M-d",
      "MM/dd/yyyy",
      "M/d/yy",
      "M/d/yyyy",
      "d/M/yyyy",
      "d-M-yyyy hh:mm:ss"
    )
    commonDateFormats.map(format => parseTimeStr(dateStr, format)).filter(_.isDefined).head
  }

  private def parseTimeStr(dateStr: String, format: String): Option[Timestamp] = {
    try {
      val formatter = new SimpleDateFormat(format)
      val datetime = formatter.parse(dateStr)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case _: Throwable => None
    }
  }

  test("test parse datetime") {
    val timestamp = parseDateTimeBestEffort("2021-02-11")
    println(timestamp)
  }

  test("test system table regex") {
    val name = "_tmp_directory123123_1626686576517"
    def isVisible(name: String): Boolean = {
      val systemTableRegex = """^__([\w]+)_(\d{13})$""".r
      name match {
        case systemTableRegex(_*) => false
        case _                    => true
      }
    }

    println(isVisible(name))

  }

}

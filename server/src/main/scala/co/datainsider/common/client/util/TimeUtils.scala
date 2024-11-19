package co.datainsider.common.client.util

import co.datainsider.common.client.domain.scheduler._
import co.datainsider.common.client.exception.UnsupportedError
import org.quartz.{CalendarIntervalScheduleBuilder, TriggerBuilder}

import java.text.SimpleDateFormat
import java.time.temporal.TemporalAdjusters
import java.time.{DayOfWeek, Instant, LocalDateTime, ZoneId}
import java.util.concurrent.TimeUnit
import java.util.{Calendar, Date, TimeZone}

object TimeUtils {

  /**
   * Tính lần chạy tiếp theo kể từ last run time dựa trên schedule time
   * Nếu ScheduleTime chưa được define thì sẽ throw exception UnsupportedError
   */
  def calculateNextRunTime(scheduleTime: ScheduleTime, lastScheduleTime: Option[Long]): Long = {
    scheduleTime match {
      case _: NoneSchedule => Long.MaxValue
      case scheduleOnce: ScheduleOnce => calculateScheduleOnce(scheduleOnce, lastScheduleTime)
      case scheduleMinutely: ScheduleMinutely => calculateScheduleMinutely(scheduleMinutely, lastScheduleTime)
      case scheduleHourly: ScheduleHourly => calculateScheduleHourly(scheduleHourly, lastScheduleTime)
      case scheduleDaily: ScheduleDaily => calculateScheduleDaily(scheduleDaily, lastScheduleTime)
      case scheduleWeekly: ScheduleWeekly => calculateScheduleWeekly(scheduleWeekly, lastScheduleTime)
      case scheduleMonthly: ScheduleMonthly => calculateScheduleMonthly(scheduleMonthly, lastScheduleTime)
      case _ => throw UnsupportedError(s"Unsupported schedule type ${scheduleTime.getClass.getSimpleName}")
    }
  }

  /**
   * Nếu job đã từng chạy thì return max value
   * Nếu job chưa từng chạy thì return thời gian được schedule
   */
  private def calculateScheduleOnce(scheduleOnce: ScheduleOnce, lastScheduleTime: Option[Long]): Long = {
    if (lastScheduleTime.nonEmpty) {
      val infinity = 99999999999999L
      infinity
    } else {
      scheduleOnce.startTime
    }
  }

  private def calculateScheduleMinutely(scheduleMinutely: ScheduleMinutely, lastScheduleTime: Option[Long]): Long = {
    val timeMark: Long = lastScheduleTime.getOrElse(scheduleMinutely.startTime)
    timeMark + TimeUnit.MINUTES.toMillis(scheduleMinutely.recurEvery)
  }

  private def calculateScheduleHourly(scheduleHourly: ScheduleHourly, lastScheduleTime: Option[Long]): Long = {
    val timeMark: Long = lastScheduleTime.getOrElse(scheduleHourly.startTime)
    timeMark + TimeUnit.HOURS.toMillis(scheduleHourly.recurEvery)
  }

  private def calculateScheduleDaily(scheduleDaily: ScheduleDaily, lastScheduleTime: Option[Long]): Long = {
    val timeMark: Long = lastScheduleTime.getOrElse(scheduleDaily.startTime)

    val trigger = TriggerBuilder
      .newTrigger()
      .withSchedule(CalendarIntervalScheduleBuilder.calendarIntervalSchedule().withIntervalInDays(scheduleDaily.recurEvery))
      .startAt(new Date(scheduleDaily.startTime))
      .build()
    trigger.getFireTimeAfter(new Date(timeMark)).getTime
  }

  private def calculateScheduleWeekly(scheduleWeekly: ScheduleWeekly, lastScheduleTime: Option[Long]): Long = {
    val timeMark: Long = lastScheduleTime.getOrElse(scheduleWeekly.startTime)

    val startsDates = calculateStartDates(scheduleWeekly).toSeq
    val triggers = startsDates
      .map(startDate => {
        TriggerBuilder
          .newTrigger()
          .withSchedule(
            CalendarIntervalScheduleBuilder
              .calendarIntervalSchedule()
              .withIntervalInWeeks(scheduleWeekly.recurEvery)
          )
          .startAt(startDate)
          .build()
      }
      )
    triggers.map(_.getFireTimeAfter(new Date(timeMark)).getTime).min
  }

  private def calculateStartDates(scheduleWeekly: ScheduleWeekly): Set[Date] = {

    val localDate = LocalDateTime.ofInstant(Instant.ofEpochMilli(scheduleWeekly.startTime), TimeZone.getDefault.toZoneId).toLocalDate
    val startDate = localDate.`with`(TemporalAdjusters.previous(DayOfWeek.SUNDAY))
    scheduleWeekly.includeDays.map(dayOfWeek => {
      val nextLocalDate =
        startDate.`with`(TemporalAdjusters.next(dayOfWeek)).atTime(scheduleWeekly.atHour, scheduleWeekly.atMinute, scheduleWeekly.atSecond)
      Date.from(nextLocalDate.atZone(ZoneId.systemDefault()).toInstant)
    })
  }

  private def calculateScheduleMonthly(scheduleMonthly: ScheduleMonthly, lastScheduleTime: Option[Long]): Long = {
    val timeMark: Long = lastScheduleTime.getOrElse(scheduleMonthly.startTime)

    val calendar = Calendar.getInstance()
    calendar.setTimeInMillis(scheduleMonthly.startTime)
    val startMonth = calendar.get(Calendar.MONTH)
    val startYear = calendar.get(Calendar.YEAR)

    scheduleMonthly.recurOnDays.map(day => {
      val dateTime = Calendar.getInstance()
      dateTime.set(Calendar.AM_PM, Calendar.AM)
      dateTime.set(Calendar.HOUR, scheduleMonthly.atHour)
      dateTime.set(Calendar.MINUTE, scheduleMonthly.atMinute)
      dateTime.set(Calendar.SECOND, scheduleMonthly.atSecond)
      dateTime.set(Calendar.DAY_OF_MONTH, day)
      dateTime.set(Calendar.MONTH, startMonth)
      dateTime.set(Calendar.YEAR, startYear)
      val startDate = dateTime.getTime
      TriggerBuilder.newTrigger().withSchedule(
        CalendarIntervalScheduleBuilder
          .calendarIntervalSchedule()
          .withIntervalInMonths(scheduleMonthly.recurEveryMonth)
      ).startAt(startDate).build()
    }).map(_.getFireTimeAfter(new Date(timeMark)).getTime).min
  }
}

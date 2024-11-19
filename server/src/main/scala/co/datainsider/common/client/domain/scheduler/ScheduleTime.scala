package co.datainsider.common.client.domain.scheduler

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

import java.time.DayOfWeek

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[NoneSchedule], name = "none_schedule"),
    new Type(value = classOf[ScheduleOnce], name = "schedule_once"),
    new Type(value = classOf[ScheduleMinutely], name = "schedule_minutely"),
    new Type(value = classOf[ScheduleHourly], name = "schedule_hourly"),
    new Type(value = classOf[ScheduleDaily], name = "schedule_daily"),
    new Type(value = classOf[ScheduleWeekly], name = "schedule_weekly"),
    new Type(value = classOf[ScheduleMonthly], name = "schedule_monthly")
  )
)
trait ScheduleTime

/**
 * Nếu sử dụng Schedule này job sẽ không được excute
 */
case class NoneSchedule() extends ScheduleTime

/**
  * Schedule run once time
  * @param startTime start job
  */
case class ScheduleOnce(startTime: Long) extends ScheduleTime

/**
  * schedule run minutely
  * @param recurEvery chạy cách bao nhiêu phút
  * @param startTime time first start job
  */
case class ScheduleMinutely(recurEvery: Long, startTime: Long = System.currentTimeMillis()) extends ScheduleTime

/**
  * schedule run hourly
  * @param recurEvery chạy cách bao nhiêu giờ
  * @param startTime time first start job
  */
case class ScheduleHourly(recurEvery: Long, startTime: Long = System.currentTimeMillis()) extends ScheduleTime

/**
  * Schedule run daily
  * @param recurEvery cách bao nhiêu ngày sẽ chạy
  * @param startTime thời gian job bắt đầu chạy
  */
case class ScheduleDaily(recurEvery: Int, startTime: Long = System.currentTimeMillis()) extends ScheduleTime

/**
  * Schedule run weekly
  * @param recurEvery cách bao nhiêu tuần sẽ chạy
  * atHour, atMinute, atSecond là thời gian sẽ chạy trong ngày (ví dụ: 1 giờ 30 phút 30 giây hằng ngày)
  * @param includeDays chạy trong những ngày này
  * @param startTime time first start job
  */
case class ScheduleWeekly(recurEvery: Int, atHour: Int, atMinute: Int, atSecond: Int, includeDays: Set[DayOfWeek] = Set.empty, startTime: Long = System.currentTimeMillis()) extends ScheduleTime

/**
  * Schedule run monthly
  * @param recurOnDays lặp lại vào ngày nào của tháng
  * @param recurEveryMonth chạy cách bao nhiêu tháng trong năm
  * atHour, atMinute, atSecond là thời gian sẽ chạy trong ngày (ví dụ: 1 giờ 30 phút 30 giây hằng ngày)
  * @param startTime time first start job
  */
case class ScheduleMonthly(recurOnDays: Set[Int], recurEveryMonth: Int, atHour: Int, atMinute: Int, atSecond: Int, startTime: Long = System.currentTimeMillis())
  extends ScheduleTime

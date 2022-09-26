# Schedule Time

```scala
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
```

```scala
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
  * schedule run hourly
  * @param recurEvery chạy cách bao nhiêu phút
  */
case class ScheduleMinutely(recurEvery: Long) extends ScheduleTime

/**
  * schedule run hourly
  * @param recurEvery chạy cách bao nhiêu giờ
  */
case class ScheduleHourly(recurEvery: Long) extends ScheduleTime

/**
  * Schedule run daily
  * @param recurEvery cách bao nhiêu ngày sẽ chạy
  * @param atTime time start job
  */
case class ScheduleDaily(recurEvery: Int, atTime: Long) extends ScheduleTime

/**
  * Schedule run weekly
  * @param recurEvery cách bao nhiêu tuần sẽ chạy
  * @param atTime thời gian chạy vào lúc
  * @param includeDays không chạy trong những ngày này
  */
case class ScheduleWeekly(recurEvery: Int, atTime: Long, includeDays: Set[DayOfWeek] = Set.empty) extends ScheduleTime

/**
  * Schedule run monthly
  * @param recurOnDays lặp lại vào ngày nào của tháng
  * @param recurEveryMonth chạy cách bao nhiêu tháng trong năm
  * @param atTime thời gian sẽ chạy
  */
case class ScheduleMonthly(recurOnDays: Set[Int], recurEveryMonth: Int, atTime: Long) extends ScheduleTime
```
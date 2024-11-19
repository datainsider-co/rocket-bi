package co.datainsider.bi.service

import co.datainsider.bi.domain.{BoostJob, BoostStatus, Dashboard}
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.bi.util.ZConfig
import co.datainsider.common.client.domain.scheduler._
import com.google.inject.Inject
import com.twitter.inject.Logging
import org.quartz.JobKey.jobKey
import org.quartz.impl.matchers.GroupMatcher
import org.quartz._

trait BoostScheduleService {

  /**
    * init all schedule all tasks
    * Boost jobs: iterate through all dashboards and schedule boost job for all chart in dashboard
    */
  def start()

  /**
    * temporary halt scheduler jobs
    */
  def stop()

  def status: BoostStatus

  def scheduleJob(dashboard: Dashboard): Unit

  def unscheduleJob(dashboardId: Long): Unit

}

class BoostScheduleServiceImpl(
    scheduler: Scheduler,
    dashboardService: DashboardService
) extends BoostScheduleService
    with Logging {

  override def start(): Unit = {

    scheduler.start()

    val orgId = 0 // TODO: support multi org
    val totalDashboards: Long = dashboardService.count(orgId).syncGet()
    val batchSize: Int = ZConfig.getInt("boost_scheduler.fetch_dashboards_batch_size", 20)
    var curOffset: Int = 0

    while (curOffset < totalDashboards) {
      try {
        val dashboards: Seq[Dashboard] = dashboardService.list(orgId, curOffset, batchSize).syncGet()
        dashboards.foreach(scheduleJob)
      } catch {
        case ex: Throwable => error(s"${this.getClass.getSimpleName}::scheduleBoostJob fail: $ex")
      } finally {
        curOffset += batchSize
      }
    }

    info(s"${this.getClass.getSimpleName}::start BoostScheduler started!")

  }

  override def stop(): Unit = {
    scheduler.standby()
  }

  override def scheduleJob(dashboard: Dashboard): Unit = {
    if (dashboard.boostInfo.isDefined && dashboard.boostInfo.get.enable) {
      val scheduleBuilder: SimpleScheduleBuilder = getScheduleBuilder(dashboard.boostInfo.get.scheduleTime)

      val boostJobDetail: JobDetail = JobBuilder
        .newJob(classOf[BoostJob])
        .withIdentity(getJobKey(dashboard.id), BoostJob.GROUP_NAME)
        .build()

      putJobData(boostJobDetail, dashboard)

      val trigger = TriggerBuilder
        .newTrigger()
        .withIdentity(BoostJob.TRIGGER_PREFIX + dashboard.id, BoostJob.GROUP_NAME)
        .withSchedule(scheduleBuilder)
        .build()

      scheduler.scheduleJob(boostJobDetail, trigger)
    }
  }

  override def unscheduleJob(dashboardId: Long): Unit = {
    scheduler.deleteJob(jobKey(getJobKey(dashboardId), BoostJob.GROUP_NAME))
  }

  private def getScheduleBuilder(scheduleTime: ScheduleTime): SimpleScheduleBuilder = {
    scheduleTime match {
      case ScheduleDaily(recurEvery, startTime)    => SimpleScheduleBuilder.repeatHourlyForever(24 * recurEvery.toInt)
      case ScheduleHourly(recurEvery, startTime)   => SimpleScheduleBuilder.repeatHourlyForever(recurEvery.toInt)
      case ScheduleMinutely(recurEvery, startTime) => SimpleScheduleBuilder.repeatMinutelyForever(recurEvery.toInt)
      case ScheduleWeekly(recurEvery, atHour, atMinute, atSecond, includeDays, startTime) =>
        SimpleScheduleBuilder.repeatHourlyForever(7 * 24 * recurEvery.toInt)
      case ScheduleMonthly(recurOnDays, recurEveryMonth, atHour, atMinute, atSecond, startTime) =>
        SimpleScheduleBuilder.repeatHourlyForever(30 * 24 * recurEveryMonth.toInt)
    }
  }

  override def status: BoostStatus = {
    val total: Int = scheduler.getJobKeys(GroupMatcher.jobGroupEquals(BoostJob.GROUP_NAME)).size()
    BoostStatus(total)
  }

  private def getJobKey(dashboardId: Long): String = {
    BoostJob.JOB_PREFIX + dashboardId
  }

  private def putJobData(jobDetail: JobDetail, dashboard: Dashboard): Unit = {
    jobDetail.getJobDataMap.put(BoostJob.DATA_KEY, dashboard)
  }
}

class MockBoostScheduleService() extends BoostScheduleService
    with Logging {

  override def start(): Unit = {
    info(s"${this.getClass.getSimpleName}::start BoostScheduler started!")
  }

  override def stop(): Unit = {
    info(s"${this.getClass.getSimpleName}::stop BoostScheduler stopped!")
  }

  override def status: BoostStatus = {
    BoostStatus(0)
  }

  override def scheduleJob(dashboard: Dashboard): Unit = {
    info(s"${this.getClass.getSimpleName}::scheduleJob dashboard: $dashboard")
  }

  override def unscheduleJob(dashboardId: Long): Unit = {
    info(s"${this.getClass.getSimpleName}::unscheduleJob dashboardId: $dashboardId")
  }
}

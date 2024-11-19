package co.datainsider.bi.domain

import co.datainsider.common.client.domain.scheduler.ScheduleTime

case class BoostInfo(enable: Boolean, scheduleTime: ScheduleTime, lastRunTime: Long = 0, nextRunTime: Long = 0)

object BoostJob {
  val JOB_PREFIX = "dashboard_"
  val TRIGGER_PREFIX = "trigger_"
  val GROUP_NAME = "DI_PERFORMANCE_BOOST"
  val DATA_KEY = "dashboard"
}

case class BoostStatus(totalJobs: Int)

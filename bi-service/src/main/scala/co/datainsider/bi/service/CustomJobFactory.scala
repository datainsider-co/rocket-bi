package co.datainsider.bi.service

import co.datainsider.bi.repository.ChartResponseRepository
import com.twitter.inject.Logging
import org.quartz.{Job, JobDetail, Scheduler, SchedulerException}
import org.quartz.spi.{JobFactory, TriggerFiredBundle}

class CustomJobFactory(
    dashboardService: DashboardService,
    chartResponseRepository: ChartResponseRepository
) extends JobFactory
    with Logging {
  override def newJob(bundle: TriggerFiredBundle, scheduler: Scheduler): Job = {
    val jobDetail: JobDetail = bundle.getJobDetail
    val jobClass: Class[_ <: Job] = jobDetail.getJobClass
    try {
      if (jobClass.isInstanceOf[Class[BoostJob]]) {
        new BoostJob(dashboardService, chartResponseRepository)
      } else {
        jobClass.newInstance()
      }
    } catch {
      case e: Exception =>
        throw new SchedulerException("Problem instantiating class '" + jobDetail.getJobClass.getName + "'", e)
    }
  }
}

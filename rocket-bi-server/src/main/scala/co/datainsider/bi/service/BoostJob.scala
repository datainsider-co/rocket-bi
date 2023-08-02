package co.datainsider.bi.service

import co.datainsider.bi.domain.request.ChartRequest
import co.datainsider.bi.domain.{BoostInfo, BoostJob, Dashboard}
import co.datainsider.bi.repository.ChartResponseRepository
import com.twitter.inject.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.TimeUtils
import org.quartz.{Job, JobDataMap, JobExecutionContext}

class BoostJob(
    dashboardService: DashboardService,
    chartResponseRepository: ChartResponseRepository
) extends Job
    with Logging {

  override def execute(context: JobExecutionContext): Unit = {
    val jobDataMap: JobDataMap = context.getJobDetail.getJobDataMap
    val dashboard: Dashboard = jobDataMap.get(BoostJob.DATA_KEY).asInstanceOf[Dashboard]

    boost(dashboard)
  }

  def boost(dashboard: Dashboard): Unit = {
    try {
      val chartRequests: Array[ChartRequest] = dashboard.toChartRequests

      chartRequests.foreach(chartRequest => {
        try {
          chartResponseRepository.queryAndPut(chartRequest.toResponseId, chartRequest).syncGet()
        } catch {
          case ex: Throwable =>
            error(
              s"${this.getClass.getSimpleName}::queryAndPut chart ${chartRequest.chartId}, dashboard ${chartRequest.dashboardId} fail with exception: ${ex.getMessage}",
              ex
            )
        }
      })

      updateDashboardStatus(dashboard)

    } catch {
      case ex: Throwable =>
        error(
          s"${this.getClass.getSimpleName}::boost dashboard ${dashboard.id} fail with exception: ${ex.getMessage}",
          ex
        )
    }
  }

  private def updateDashboardStatus(dashboard: Dashboard): Unit = {
    require(dashboard.boostInfo.isDefined, s"not found boost info for dashboard ${dashboard.id}")

    val boostInfo: BoostInfo = dashboard.boostInfo.get
    val nextRunTime: Long = TimeUtils.calculateNextRunTime(boostInfo.scheduleTime, Some(System.currentTimeMillis()))
    val newBoostInfo = boostInfo.copy(lastRunTime = System.currentTimeMillis(), nextRunTime = nextRunTime)

    dashboardService.updateBoostInfo(dashboard.orgId, dashboard.id, Some(newBoostInfo))
  }
}

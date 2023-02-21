package datainsider.data_cook.module

import com.twitter.inject.{Injector, TwitterModule}
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.data_cook.repository.{EtlJobHistoryRepository, EtlJobRepository}
import datainsider.data_cook.service.scheduler.ScheduleService
import datainsider.data_cook.service.worker.WorkerService

/**
  * @author tvc12 - Thien Vi
  * @created 10/13/2021 - 5:35 PM
  */
object DataCookJobModule extends TwitterModule {
  override def singletonPostWarmupComplete(injector: Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    fixJosStatuses(injector)
    startEtlScheduler(injector)
    startEtlWorker(injector)
  }

  /**
   * move status from running or queued to terminated
   * @param injector
   */
  private def fixJosStatuses(injector: Injector): Unit = {
    try {
      logger.info("run fix job statuses")
      injector.instance[EtlJobRepository].fixJosStatuses().syncGet()
      injector.instance[EtlJobHistoryRepository].fixJosStatuses().syncGet()
      logger.info("completed fix job statuses")
    } catch {
      case ex: Throwable => logger.error(s"failed fix job statuses ${ex.getMessage}", ex)
    }
  }

  private def startEtlWorker(injector: Injector): Unit = {
    info("ETL::worker::starting")
    val workerService = injector.instance[WorkerService]
    workerService.start()
    info("ETL::worker::started")
  }

  private def startEtlScheduler(injector: Injector): Unit = {
    info("ETL::Scheduler::starting")
    val scheduler = injector.instance[ScheduleService]
    scheduler.queueJobs()
    info("ETL::Scheduler::started")
  }

}

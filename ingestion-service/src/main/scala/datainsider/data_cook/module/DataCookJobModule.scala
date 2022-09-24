package datainsider.data_cook.module

import com.twitter.inject.TwitterModule
import datainsider.data_cook.domain.{EtlJob, EtlJobProgress}
import datainsider.data_cook.service.scheduler.ScheduleService
import datainsider.data_cook.service.worker.WorkerService

/**
  * @author tvc12 - Thien Vi
  * @created 10/13/2021 - 5:35 PM
  */
object DataCookJobModule extends TwitterModule {
  override def singletonPostWarmupComplete(injector: com.twitter.inject.Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    startEtlScheduler(injector)
    startEtlWorker(injector)
  }

  private def startEtlWorker(injector: com.twitter.inject.Injector): Unit = {
    info("ETL::worker::starting")
    val workerService = injector.instance[WorkerService]
    workerService.start()
    info("ETL::worker::started")
  }

  private def startEtlScheduler(injector: com.twitter.inject.Injector): Unit = {
    info("ETL::Scheduler::starting")
    val scheduler = injector.instance[ScheduleService]
    scheduler.queueJobs()
    info("ETL::Scheduler::started")
  }
}

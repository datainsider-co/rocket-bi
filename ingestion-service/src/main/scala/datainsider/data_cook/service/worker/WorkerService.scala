package datainsider.data_cook.service.worker
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.response.JobStatusResponse
import datainsider.data_cook.domain.{EtlJob, EtlJobProgress}
import datainsider.data_cook.pipeline.ExecutorResolver
import datainsider.data_cook.service.scheduler.ScheduleService
import datainsider.data_cook.service.table.EtlTableService
import education.x.commons.KVS

import java.util.concurrent._
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject



/** *
  * Worker service chạy trong 1 thread riêng mục đích:
  *
  * 1/ lấy job từ Job-Scheduler (có thể lấy nhiều job)
  *
  * 2/ execute job
  *
  * 3/ repeat
  */
trait WorkerService {
  def start(): Future[Boolean]

  def stop(): Future[Boolean]

  def status(): Future[JobStatusResponse]
}

class WorkerServiceImpl @Inject() (
    scheduleService: ScheduleService,
    removeDataWorker: RemovePreviewEtlDataWorker,
    runningJobMap: KVS[EtlJobId, Boolean],
    tableService: EtlTableService,
    executorResolver: ExecutorResolver
) extends WorkerService
    with Logging {

  val nConsumers: Int = ZConfig.getInt("data_cook.num_job_worker", 4)
  val sleepIntervalInMs: Int = ZConfig.getInt("data_cook.sleep_interval_ms", 15000)
  val previewSleepIntervalInMs: Int = ZConfig.getInt("data_cook.preview_sleep_interval_ms", 500)
  val isRunning = new AtomicBoolean(false)
  val threadPool: ThreadPoolExecutor = createPool(nConsumers)
  val removePreviewDataIntervalInMinutes: Int = ZConfig.getInt("data_cook.remove_preview_etl_data_interval_minutes", 10)
  val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

  def createPool(nConsumers: Int): ThreadPoolExecutor = {
    val pool = new ThreadPoolExecutor(
      nConsumers,
      nConsumers,
      0L,
      TimeUnit.MILLISECONDS,
      new LinkedBlockingQueue[Runnable](nConsumers)
    )
    /* this handler will block if there is more than nConsumers threads try to execute,
       job in pool will wait until there is available slot */
    pool.setRejectedExecutionHandler { (runnable: Runnable, threadPoolExecutor: ThreadPoolExecutor) =>
      {
        threadPoolExecutor.getQueue.put(runnable)
      }
    }
    pool
  }

  /** *
    * Init Job Worker
    * Get Job & Put to queue for worker
    */
  override def start(): Future[Boolean] = {
    isRunning.set(true)
    startJobWorker()
    startJobRemovePreviewEtlData()
    Future.True
  }

  /**
    * stop receiving jobs, make sure all job are delivered to worker (worker might still processing jobs)
    */
  override def stop(): Future[Boolean] = {
    isRunning.set(false)
    threadPool.shutdown()
    Future.True
  }

  private def startJobWorker(): Unit = {
    val executeJobThread = new Thread(() => {
      while (isRunning.get()) {
        scheduleService.getNextJob.syncGet() match {
          case Some(jobInfo) => {
            info(s"job consumer take job: ${jobInfo.job}")
            runningJobMap.add(jobInfo.job.id, true)
            val worker: Runnable = new EtlJobWorker(jobInfo, tableService, reportProgress, runningJobMap, executorResolver)
            threadPool.execute(worker)
          }
          case None => Thread.sleep(sleepIntervalInMs)
        }
      }
    })
    executeJobThread.start()
  }

  private def reportProgress(jobProgress: EtlJobProgress): Future[Unit] = {
    scheduleService
      .reportJob(jobProgress)
      .rescue {
        case ex: Throwable =>
          error(s"report job fail ${jobProgress}", ex)
          Future.Unit
      }
      .unit
  }

  private def startJobRemovePreviewEtlData(): Unit = {
    scheduler.scheduleAtFixedRate(
      removeDataWorker,
      0,
      removePreviewDataIntervalInMinutes,
      TimeUnit.MINUTES
    )
  }

  override def status(): Future[JobStatusResponse] = {
    Future.value(JobStatusResponse(
      isRunning = isRunning.get(),
      jobQueueSize = threadPool.getQueue.size(),
      totalJobCompleted = threadPool.getCompletedTaskCount,
      numberJobRunning = threadPool.getActiveCount
    ))
  }
}

class MockWorkerService extends WorkerService {
  override def start(): Future[Boolean] = Future.True

  override def stop(): Future[Boolean] = Future.True

  override def status(): Future[JobStatusResponse] = Future(JobStatusResponse(true, 100, 120, 200))
}

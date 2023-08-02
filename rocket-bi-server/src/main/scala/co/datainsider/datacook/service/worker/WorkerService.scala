package co.datainsider.datacook.service.worker

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.response.JobStatusResponse
import co.datainsider.datacook.domain.{ETLStatus, EtlJob, EtlJobProgress, JobInfo}
import co.datainsider.datacook.pipeline.ExecutorResolver
import co.datainsider.datacook.pipeline.operator.OperatorService
import co.datainsider.datacook.service.scheduler.ScheduleService
import com.twitter.inject.{Injector, Logging}
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.ZConfig
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
    removeDataWorker: RemoveEtlDataWorker,
    runningJobMap: KVS[EtlJobId, Boolean],
    operatorService: OperatorService,
    engineResolver: EngineResolver,
    connectionService: ConnectionService,
    injector: Injector
) extends WorkerService
    with Logging {

  val nConsumers: Int = ZConfig.getInt("data_cook.num_job_worker", 4)
  val sleepIntervalInMs: Int = ZConfig.getInt("data_cook.sleep_interval_ms", 15000)
  val isRunning = new AtomicBoolean(false)
  val threadPool: ThreadPoolExecutor = createPool(nConsumers)
  val removeETLDataIntervalInMin: Int = ZConfig.getInt("data_cook.remove_preview_etl_data_interval_minutes", 10)
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
    startRemoveEtlDataWorker()
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
            try {
              info(s"job consumer take job: ${jobInfo.job}")
              runningJobMap.add(jobInfo.job.id, true)
              val resolver: ExecutorResolver = getExecutorResolver(jobInfo)
              val worker: Runnable =
                new DataCookWorker(jobInfo, operatorService, reportProgress, runningJobMap, resolver)
              threadPool.execute(worker)
            } catch {
              case ex: Throwable =>
                error(s"job consumer fail to take job: ${jobInfo.job}", ex)
                runningJobMap.add(jobInfo.job.id, false)
                reportProgress(
                  EtlJobProgress(
                    organizationId = jobInfo.job.organizationId,
                    historyId = jobInfo.historyId,
                    jobId = jobInfo.job.id,
                    startTime = System.currentTimeMillis(),
                    totalExecutionTime = 0,
                    status = ETLStatus.Error,
                    message = Some(ex.getMessage),
                    operatorError = None,
                    tableSchemas = Array.empty,
                  )
                )
            }
          }
          case None => Thread.sleep(sleepIntervalInMs)
        }
      }
    })
    executeJobThread.start()
  }

  private def getExecutorResolver(jobInfo: JobInfo[EtlJob]): ExecutorResolver = {
    val dataSource: Connection = connectionService.getTunnelConnection(jobInfo.job.organizationId).syncGet()
    val engine: Engine[Connection] = engineResolver.resolve(dataSource.getClass).asInstanceOf[Engine[Connection]]
    engine.getExecutorResolver(dataSource, operatorService)(injector)
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

  private def startRemoveEtlDataWorker(): Unit = {
    scheduler.scheduleAtFixedRate(
      removeDataWorker,
      0,
      removeETLDataIntervalInMin,
      TimeUnit.MINUTES
    )
  }

  override def status(): Future[JobStatusResponse] = {
    Future.value(
      JobStatusResponse(
        isRunning = isRunning.get(),
        jobQueueSize = threadPool.getQueue.size(),
        totalJobCompleted = threadPool.getCompletedTaskCount,
        numberJobRunning = threadPool.getActiveCount
      )
    )
  }
}

case class MockWorkerService() extends WorkerService {
  override def start(): Future[Boolean] = Future.True

  override def stop(): Future[Boolean] = Future.True

  override def status(): Future[JobStatusResponse] = Future.value(JobStatusResponse(isRunning = true, 999, 999, 999))
}

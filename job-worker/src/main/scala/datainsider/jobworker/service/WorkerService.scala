package datainsider.jobworker.service

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.jobworker.domain.{JobProgress, JobStatus}
import datainsider.jobworker.service.worker.VersioningWorker
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.ZConfig

import java.util.concurrent._
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import scala.collection.mutable

case class JobStatusResponse(
    isRunning: Boolean,
    jobQueueSize: Long,
    totalJobCompleted: Long,
    numberJobRunning: Long,
    progresses: Map[Long, JobProgress]
)

/** *
  * Worker service chạy trong 1 thread riêng mục đích:
  * 1/ lấy job từ Job-Scheduler (có thể lấy nhiều job)
  * 2/ execute job
  * 3/ report progress của job
  * 4/ report job done
  * 5/ clean job resources
  * 6/ repeat
  */
trait WorkerService {

  def start(): Future[Boolean]

  def stop(): Future[Boolean]

  def status(): Future[JobStatusResponse]
}

class SimpleWorkerService @Inject() (
    scheduleService: ScheduleService,
    versioningWorker: VersioningWorker,
    runnableJobFactory: RunnableJobFactory
) extends WorkerService
    with Logging {

  val nConsumers: Int = ZConfig.getInt("worker_service.num_workers", 4)
  val sleepIntervalInMs: Int = ZConfig.getInt("worker_service.sleep_interval_ms", 10000)

  val workersPool: ThreadPoolExecutor = new ThreadPoolExecutor(
    nConsumers,
    nConsumers,
    0L,
    TimeUnit.MILLISECONDS,
    new LinkedBlockingQueue[Runnable](nConsumers)
  )
  /* this handler will block if there is more than nConsumers threads try to execute,
     job in pool will wait until there is available slot */
  workersPool.setRejectedExecutionHandler { (runnable: Runnable, threadPoolExecutor: ThreadPoolExecutor) =>
    {
      threadPoolExecutor.getQueue.put(runnable)
    }
  }

  val versioningWorkerScheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

  private val isRunning = new AtomicBoolean(false)
  private val runningProgresses = mutable.Map[Long, JobProgress]()

  startVersioningWorker()
  addShutdownHook()

  /** *
    * Init Job Worker
    * Get Job & Put to queue for worker
    *
    * @return
    */
  override def start(): Future[Boolean] = {
    startJobWorkers()
    Future.value(true)
  }

  /**
    * stop receiving jobs, make sure all job are delivered to worker (worker might still processing jobs)
    * @return
    */
  override def stop(): Future[Boolean] = {
    isRunning.set(false)
    Future.value(true)
  }

  override def status(): Future[JobStatusResponse] = {
    Future.value(
      JobStatusResponse(
        isRunning = isRunning.get(),
        jobQueueSize = workersPool.getQueue.size(),
        totalJobCompleted = workersPool.getCompletedTaskCount,
        numberJobRunning = workersPool.getActiveCount,
        progresses = runningProgresses.toMap
      )
    )
  }

  private def startJobWorkers(): Unit = {
    isRunning.set(true)

    val executeJobThread = new Thread(
      () => {

        while (isRunning.get()) {
          try {
            if (workersPool.getActiveCount <= nConsumers) {
              scheduleService.getJob.sync() match {
                case Some(syncInfo) =>
                  logger.info(s"job consumer take job: ${syncInfo}")
                  val syncJob: Runnable = runnableJobFactory.create(syncInfo, reportProgress)
                  workersPool.execute(syncJob)
                case None =>
              }
            }
          } catch {
            case e: Throwable => error(s"WorkerService::getNextJob fail: $e")
          }

          Thread.sleep(sleepIntervalInMs)
        }
      },
      "PullJobsThread"
    )

    executeJobThread.start()
    info(s"${this.getClass.getSimpleName}::startJobWorker PullJobsThread started with $nConsumers workers.")
  }

  private def startVersioningWorker(): Unit = {
    versioningWorkerScheduler.scheduleAtFixedRate(
      () => {
        versioningWorker.run()
      },
      0,
      1,
      TimeUnit.HOURS
    )

    info(s"${this.getClass.getSimpleName}::startVersioningWorker versioning worker started!")
  }

  private def reportProgress(progress: JobProgress): Future[Unit] = {

    if (progress.jobStatus == JobStatus.Syncing) {
      runningProgresses.put(progress.jobId, progress)
    } else {
      runningProgresses.remove(progress.jobId)
    }

    scheduleService
      .reportJob(progress)
      .map(success => {
        if (!success) logger.info(s"report job fail: $progress")
      })
  }

  private def addShutdownHook(): Unit = {
    scala.sys.addShutdownHook({

      stop()

      try {
        runningProgresses.foreach {
          case (jobId, progress) => reportProgress(progress.customCopy(JobStatus.Terminated)).sync()
        }

        info(s"${this.getClass.getSimpleName}::ShutDownHook terminate ${runningProgresses.size} running jobs.")

      } catch {
        case e: Throwable => error(s"${this.getClass.getSimpleName}::stop failed with exception: $e")
      } finally {
        workersPool.shutdown()
        versioningWorkerScheduler.shutdown()
      }
    })

    info(s"${this.getClass.getSimpleName}::addShutdownHook shutdown hook added.")
  }

}

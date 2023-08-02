package co.datainsider.datacook.service.scheduler

import com.twitter.util.Future
import datainsider.client.domain.scheduler.Ids.JobId
import co.datainsider.datacook.domain._

import scala.collection.mutable

/** *
  * Schedule Job, provide available Job for etl
  */
trait ScheduleService {

  /**
    * Get Next Job For Execute
    */
  def getNextJob: Future[Option[JobInfo[EtlJob]]]

  /**
    * Report job by Job Progress
    */
  def reportJob(jobProgress: EtlJobProgress): Future[Boolean]

  /**
    * Get Job Progresses in mem
    */
  def getJobProgresses: Future[mutable.Map[JobId, EtlJobProgress]]

  /**
    * Force run a job, throw exception if force run failed
    */
  def forceRun(orgId: Long, jobId: JobId, atTime: Long): Future[Unit]

  def killJob(orgId: Long, jobId: JobId): Future[Boolean]

  /**
    * Queue
    */
  def queueJobs(): Unit
}

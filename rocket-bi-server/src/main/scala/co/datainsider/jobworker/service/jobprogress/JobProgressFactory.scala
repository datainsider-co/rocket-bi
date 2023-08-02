package co.datainsider.jobworker.service.jobprogress

import co.datainsider.jobworker.domain.{Job, JobProgress}
import co.datainsider.jobworker.exception.CreateJobProgressException
import co.datainsider.jobworker.service.worker2.JobWorkerProgress

/**
 * trait to create job progress from job and job worker progress.
 *
 * @author tvc12 - Thien Vi
 */
trait JobProgressFactory[J <: Job] {
  @throws[CreateJobProgressException]("if can not create job progress")
  def create(syncId: Long, job: J, progress: JobWorkerProgress): JobProgress
}

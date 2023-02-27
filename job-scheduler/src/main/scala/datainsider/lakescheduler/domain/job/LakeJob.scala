package datainsider.lakescheduler.domain.job

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonProperty, JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.lakescheduler.domain.LakeJobProgress
import datainsider.lakescheduler.domain.job.LakeJobStatus.LakeJobStatus
import datainsider.lakescheduler.domain.job.LakeJobType.LakeJobType

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JavaJob], name = "java_job"),
    new Type(value = classOf[SqlJob], name = "sql_job")
  )
)
trait LakeJob {

  /**
    *
    * @return organization id
    */

  def orgId: Long

  /** *
    *
    * @return a unique id for Job
    */
  def jobId: JobId

  /**
    * @return a user id of creator
    */
  def creatorId: String

  /** *
    *
    * @return name of job
    */
  def name: String

  /** *
    *
    * @return job's type
    */
  @JsonScalaEnumeration(classOf[LakeJobTypeRef])
  @JsonProperty("job_type")
  def jobType: LakeJobType

  /** *
    *
    * @return the last time this job
    */
  def lastRunTime: Long

  /** *
    *
    * @return last run status (status when complete: finished or error), not the status when running
    */
  @JsonScalaEnumeration(classOf[LakeJobStatusRef])
  def lastRunStatus: LakeJobStatus

  /** *
    *
    * @return current run status
    */
  @JsonScalaEnumeration(classOf[LakeJobStatusRef])
  def currentJobStatus: LakeJobStatus

  /**
    *
    * @return time schedule to run job (ex: schedule once at 10:00:00 10/06/2021, schedule daily at 10:00:00 every 2 day)
    */
  def scheduleTime: ScheduleTime

  /**
   *
   * @return last yarn application id
   */
  def yarnAppId: String

  /***
   * @return data for this job to execute by JobWorker
   */
  def jobData: Map[String, Any]

  def customCopy(
      lastRunStatus: LakeJobStatus = this.lastRunStatus,
      currentJobStatus: LakeJobStatus = this.currentJobStatus,
      lastRunTime: Long = this.lastRunTime,
      creatorId: String = this.creatorId,
      yarnAppId: String = this.yarnAppId,
      nextRunTime: Long = this.nextRunTime
  ): LakeJob

  def copyJobStatus(progress: LakeJobProgress): LakeJob

  def nextRunTime: Long
}

class LakeJobTypeRef extends TypeReference[LakeJobType.type]

object LakeJobType extends Enumeration {
  type LakeJobType = Value
  val Sql: LakeJobType = Value("SQL")
  val Python: LakeJobType = Value("Python")
  val Java: LakeJobType = Value("Java")
  val Other: LakeJobType.Value = Value("Others")
}

object LakeJobStatus extends Enumeration {
  type LakeJobStatus = Value
  val Init: LakeJobStatus.Value = Value("Initialized")
  val Queued: LakeJobStatus.Value = Value("Queued")
  val Compiling: LakeJobStatus.Value = Value("Compiling")
  val Running: LakeJobStatus.Value = Value("Running")
  val Finished: LakeJobStatus.Value = Value("Finished")
  val Error: LakeJobStatus.Value = Value("Error")
  val Killed: LakeJobStatus.Value = Value("Killed")
  val Unknown: LakeJobStatus.Value = Value("Unknown")
}

class LakeJobStatusRef extends TypeReference[LakeJobStatus.type]

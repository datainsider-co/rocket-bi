package datainsider.lakescheduler.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.jobscheduler.domain.Ids.{JobId, OrgId, RunId}
import datainsider.lakescheduler.domain.job.LakeJobStatus.LakeJobStatus
import datainsider.lakescheduler.domain.job.LakeJobStatusRef

case class LakeJobHistory(
    runId: RunId = 0,
    jobId: JobId,
    jobName: String,
    yarnAppId: String,
    startTime: Long,
    updatedTime: Long,
    endTime: Long,
    @JsonScalaEnumeration(classOf[LakeJobStatusRef]) jobStatus: LakeJobStatus,
    message: String
)

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JavaJobProgress], name = "java_job_progress"),
    new Type(value = classOf[SqlJobProgress], name = "sql_job_progress")
  )
)
trait LakeJobProgress {

  def orgId: Long

  def runId: Long

  def jobId: JobId

  def startTime: Long

  def updatedTime: Long

  @JsonScalaEnumeration(classOf[LakeJobStatusRef])
  def jobStatus: LakeJobStatus

  def progressData: Map[String, Any]

  def message: Option[String]
}

case class JavaJobProgress(
    orgId: OrgId,
    runId: RunId,
    jobId: JobId,
    yarnAppId: Option[String],
    startTime: Long,
    updatedTime: Long,
    jobStatus: LakeJobStatus,
    message: Option[String] = None
) extends LakeJobProgress {
  override def progressData: Map[String, Any] = {
    Map("yarn_app_id" -> yarnAppId.getOrElse(""))
  }
}

case class SqlJobProgress(
    orgId: OrgId,
    runId: RunId,
    jobId: JobId,
    yarnAppId: Option[String],
    startTime: Long,
    updatedTime: Long,
    jobStatus: LakeJobStatus,
    message: Option[String] = None
) extends LakeJobProgress {
  override def progressData: Map[String, Any] = {
    Map("yarn_app_id" -> yarnAppId.getOrElse(""))
  }
}

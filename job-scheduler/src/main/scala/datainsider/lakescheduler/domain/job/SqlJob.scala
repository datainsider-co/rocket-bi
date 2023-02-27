package datainsider.lakescheduler.domain.job

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.util.JsonUtils
import datainsider.lakescheduler.domain.job.LakeJobStatus.LakeJobStatus
import datainsider.lakescheduler.domain.{HadoopResultOutput, LakeJobProgress, ResultOutput}
import datainsider.lakescheduler.domain.job.LakeJobType.LakeJobType

import java.sql.ResultSet

case class SqlJob(
    orgId: Long = -1L,
    jobId: JobId = 0,
    creatorId: String,
    name: String,
    lastRunTime: Long,
    nextRunTime: Long = System.currentTimeMillis(),
    @JsonScalaEnumeration(classOf[LakeJobStatusRef])
    lastRunStatus: LakeJobStatus,
    @JsonScalaEnumeration(classOf[LakeJobStatusRef])
    currentJobStatus: LakeJobStatus,
    scheduleTime: ScheduleTime = new NoneSchedule,
    yarnAppId: String = "",
    query: String,
    outputs: Seq[ResultOutput]
) extends LakeJob {

  override def jobType: LakeJobType = LakeJobType.Sql

  override def jobData: Map[String, Any] = {
    Map(
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "query" -> query,
      "outputs" -> JsonUtils.toJson(outputs.toArray),
      "yarn_app_id" -> yarnAppId
    )
  }

  override def copyJobStatus(progress: LakeJobProgress): LakeJob = {
    progress.jobStatus match {
      case LakeJobStatus.Finished =>
        this.copy(
          currentJobStatus = LakeJobStatus.Finished,
          lastRunTime = progress.updatedTime,
          lastRunStatus = LakeJobStatus.Finished
        )
      case LakeJobStatus.Error =>
        this.copy(
          currentJobStatus = LakeJobStatus.Error,
          lastRunTime = progress.updatedTime,
          lastRunStatus = LakeJobStatus.Error
        )
      case _ =>
        this.copy(
          currentJobStatus = progress.jobStatus
        )
    }
  }

  override def customCopy(
      lastRunStatus: LakeJobStatus,
      currentJobStatus: LakeJobStatus,
      lastRunTime: JobId,
      creatorId: String,
      yarnAppId: String,
      nextRunTime: Long
  ): LakeJob =
    this.copy(
      currentJobStatus = currentJobStatus,
      lastRunStatus = lastRunStatus,
      lastRunTime = lastRunTime,
      creatorId = creatorId,
      yarnAppId = yarnAppId,
      nextRunTime = nextRunTime
    )
}

object SqlJob {
  def fromResultSet(rs: ResultSet): LakeJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))
    SqlJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      name = rs.getString("name"),
      creatorId = rs.getString("creator_id"),
      lastRunTime = rs.getLong("last_run_time"),
      nextRunTime = rs.getLong("next_run_time"),
      lastRunStatus = LakeJobStatus.withName(rs.getString("last_run_status")),
      currentJobStatus = LakeJobStatus.withName(rs.getString("current_job_status")),
      scheduleTime = JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue()),
      query = jobData.get("query").textValue(),
      outputs = JsonUtils.fromJson[Seq[ResultOutput]](jobData.get("outputs").textValue()),
      yarnAppId = jobData.get("yarn_app_id").textValue()
    )
  }
}

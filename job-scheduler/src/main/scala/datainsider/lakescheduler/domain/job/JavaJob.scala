package datainsider.lakescheduler.domain.job

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.util.JsonUtils
import datainsider.lakescheduler.domain.{GitCloneInfo, LakeJobProgress}
import datainsider.lakescheduler.domain.job.BuildTool.BuildTool
import datainsider.lakescheduler.domain.job.LakeJobStatus.LakeJobStatus
import datainsider.lakescheduler.domain.job.LakeJobType.LakeJobType

import java.sql.ResultSet

case class JavaJob(
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
    gitCloneInfo: GitCloneInfo,
    @JsonScalaEnumeration(classOf[BuildToolRef])
    buildTool: BuildTool,
    buildCmd: String,
    mainClass: String = "",
    args: String = ""
) extends LakeJob {

  override def jobType: LakeJobType = LakeJobType.Java

  /**   *
    *
    * @return data for this job to execute by JobWorker
    */
  override def jobData: Map[String, Any] = {
    Map(
      "schedule_time" -> JsonUtils.toJson(scheduleTime),
      "yarn_app_id" -> yarnAppId,
      "git_clone_info" -> JsonUtils.toJson(gitCloneInfo),
      "build_tool" -> buildTool.toString,
      "build_cmd" -> buildCmd,
      "main_class" -> mainClass,
      "args" -> args
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

class BuildToolRef extends TypeReference[BuildTool.type]

object BuildTool extends Enumeration {
  type BuildTool = Value
  val Maven: BuildTool.Value = Value("Maven")
  val Sbt: BuildTool.Value = Value("Sbt")
}

object JavaJob {
  def fromResultSet(rs: ResultSet): LakeJob = {
    val jobData: JsonNode = JsonUtils.readTree(rs.getString("job_data"))

    JavaJob(
      orgId = rs.getLong("organization_id"),
      jobId = rs.getLong("id"),
      creatorId = rs.getString("creator_id"),
      name = rs.getString("name"),
      lastRunTime = rs.getLong("last_run_time"),
      nextRunTime = rs.getLong("next_run_time"),
      lastRunStatus = LakeJobStatus.withName(rs.getString("last_run_status")),
      currentJobStatus = LakeJobStatus.withName(rs.getString("current_job_status")),
      scheduleTime = JsonUtils.fromJson[ScheduleTime](jobData.get("schedule_time").textValue()),
      yarnAppId = jobData.get("yarn_app_id").textValue(),
      gitCloneInfo = JsonUtils.fromJson[GitCloneInfo](jobData.get("git_clone_info").textValue()),
      buildTool = BuildTool.withName(jobData.get("build_tool").textValue()),
      buildCmd = jobData.get("build_cmd").textValue(),
      mainClass = jobData.get("main_class").textValue(),
      args = jobData.get("args").textValue()
    )
  }
}

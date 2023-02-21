package datainsider.analytics.repository

import com.twitter.util.Future
import datainsider.analytics.domain.{JobInfo, JobStatus, ReportType}
import datainsider.analytics.domain.JobStatus.JobStatus
import datainsider.analytics.domain.ReportType.ReportType
import datainsider.client.domain.Page
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.{JdbcClient, JsonParser}

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer

@deprecated("no longer used")
trait JobInfoRepository {

  def list(from: Int, size: Int): Future[Page[JobInfo]]

  def searchJobInfos(jobStatues: Seq[JobStatus], from: Int, size: Int): Future[Page[JobInfo]]

  def getJobInfo(jobId: String): Future[Option[JobInfo]]

  def getJobInfo(organizationId: Long, reportType: ReportType, reportTime: Long): Future[Option[JobInfo]]

  def addJobInfo(jobInfo: JobInfo): Future[JobInfo]

  def addJobInfos(jobInfos: Seq[JobInfo]): Future[Int]

  def updateJobStatus(
      jobId: String,
      startedTime: Long,
      duration: Int,
      runCount: Int,
      jobStatus: JobStatus
  ): Future[Boolean]

  def deleteJobInfo(jobId: String): Future[Boolean]
}

case class JobInfoRepositoryImpl(client: JdbcClient, tblName: String) extends JobInfoRepository {

  override def list(from: Int, size: Int): Future[Page[JobInfo]] = {
    Future {
      val countQuery = s"SELECT COUNT(job_id) FROM $tblName"
      val query = s"""
                     |SELECT *
                     |FROM $tblName
                     |ORDER BY created_time DESC LIMIT ?,?
                     |""".stripMargin
      val total = client.executeQuery(countQuery)(rs => if (rs.next()) rs.getInt(1) else 0)
      val jobs = client.executeQuery(query, from, size)(readJobInfos)

      Page(total, jobs)
    }
  }

  override def searchJobInfos(jobStatues: Seq[JobStatus], from: Int, size: Int): Future[Page[JobInfo]] = {
    Future {
      val countQuery = s"""
                         |SELECT COUNT(job_id)
                         |FROM $tblName
                         |WHERE job_status IN (${jobStatues.map(_ => "?").mkString(", ")})
                         |""".stripMargin
      val query = s"""
                     |SELECT *
                     |FROM $tblName
                     |WHERE job_status IN (${jobStatues.map(_ => "?").mkString(", ")})
                     |ORDER BY created_time DESC LIMIT ?,?
                     |""".stripMargin

      val total =
        client.executeQuery(countQuery, jobStatues.map(_.toString): _*)(rs => if (rs.next()) rs.getInt(1) else 0)
      val jobs = client.executeQuery(query, (jobStatues.map(_.toString) ++ Seq(from, size)): _*)(readJobInfos)

      Page(total, jobs)
    }
  }

  override def getJobInfo(jobId: String): Future[Option[JobInfo]] = {
    Future {
      val query = s"""
                     |SELECT *
                     |FROM $tblName
                     |WHERE job_id=?
                     |""".stripMargin
      client.executeQuery(query, jobId)(readJobInfos).headOption
    }
  }

  override def getJobInfo(organizationId: Long, reportType: ReportType, reportTime: Long): Future[Option[JobInfo]] = {
    Future {
      val query = s"""
                      |SELECT *
                      |FROM $tblName
                      |WHERE organization_id=? AND report_type=? AND report_time=?
                      |""".stripMargin
      client.executeQuery(query, organizationId, reportType.toString, reportTime)(readJobInfos).headOption
    }
  }

  override def addJobInfo(jobInfo: JobInfo): Future[JobInfo] = {
    Future {
      val query = s"""
                     |INSERT INTO $tblName(job_id,organization_id,report_type,name,description,report_time,created_time,started_time,duration,run_count, params, job_status )
                     |VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
                     |""".stripMargin
      val columns = Seq(
        jobInfo.jobId,
        jobInfo.organizationId,
        jobInfo.reportType.toString,
        jobInfo.name,
        jobInfo.description.getOrElse(""),
        jobInfo.reportTime,
        jobInfo.createdTime,
        jobInfo.startedTime.getOrElse(0),
        jobInfo.duration.getOrElse(0),
        jobInfo.runCount.getOrElse(0),
        JsonParser.toJson(jobInfo.params),
        jobInfo.jobStatus.toString
      )
      client.executeUpdate(query, columns: _*) > 0 match {
        case true => jobInfo
        case _    => throw DbExecuteError(s"Error to save this job: ${jobInfo.jobId}")
      }

    }

  }

  override def addJobInfos(jobInfos: Seq[JobInfo]): Future[Int] = {
    Future {
      val query = s"""
                     |INSERT INTO $tblName(job_id,organization_id,report_type,name,description,report_time,created_time,started_time,duration,run_count, params, job_status )
                     |VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
                     |""".stripMargin
      val records = jobInfos.map(jobInfo =>
        Seq(
          jobInfo.jobId,
          jobInfo.organizationId,
          jobInfo.reportType.toString,
          jobInfo.name,
          jobInfo.description.getOrElse(""),
          jobInfo.reportTime,
          jobInfo.createdTime,
          jobInfo.startedTime.getOrElse(0),
          jobInfo.duration.getOrElse(0),
          jobInfo.runCount.getOrElse(0),
          JsonParser.toJson(jobInfo.params),
          jobInfo.jobStatus.toString
        )
      )
      client.executeBatchUpdate(query, records)
    }
  }

  override def updateJobStatus(
      jobId: String,
      startedTime: Long,
      duration: Int,
      runCount: Int,
      jobStatus: JobStatus
  ): Future[Boolean] = {
    Future {
      val query =
        s"""
           |UPDATE $tblName SET started_time=?, duration=?, run_count=?, job_status=?
           |WHERE job_id=?
           |""".stripMargin

      client.executeUpdate(query, startedTime, duration, runCount, jobStatus.toString, jobId) > 0
    }
  }

  override def deleteJobInfo(jobId: String): Future[Boolean] = {
    Future {
      val query =
        s"""
           |DELETE FROM $tblName
           |WHERE job_id=?
           |""".stripMargin

      client.execute(query, jobId)
    }
  }

  private def readJobInfos(rs: ResultSet): Seq[JobInfo] = {

    val buffer = ListBuffer.empty[JobInfo]
    while (rs.next()) {
      buffer.append(readSingleJobInfo(rs))
    }
    buffer
  }

  private def readSingleJobInfo(rs: ResultSet) = {
    val jobId = rs.getString("job_id")
    val organizationId = rs.getLong("organization_id")
    val reportType = ReportType.withName(rs.getString("report_type"))
    val name = rs.getString("name")
    val description = Option(rs.getString("description"))
    val reportTime = rs.getLong("report_time")
    val createdTime = rs.getLong("created_time")
    val startedTime = Option(rs.getLong("started_time"))
    val duration = Option(rs.getInt("duration"))
    val runCount = Option(rs.getInt("run_count"))
    val params = Option(rs.getString("params")).map(JsonParser.fromJson[Map[String, Any]](_)).getOrElse(Map.empty)
    val jobStatus = JobStatus.withName(rs.getString("job_status"))

    JobInfo(
      jobId,
      organizationId,
      reportType,
      name,
      description,
      reportTime,
      createdTime,
      startedTime,
      duration,
      runCount,
      params,
      jobStatus
    )
  }
}

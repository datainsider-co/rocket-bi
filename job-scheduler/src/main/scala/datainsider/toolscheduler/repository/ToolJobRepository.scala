package datainsider.toolscheduler.repository

import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.domain.request.SortRequest
import datainsider.jobscheduler.repository.MySqlSchemaManager
import datainsider.toolscheduler.domain.ToolJob

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait ToolJobRepository {

  def get(orgId: Long, jobId: Long): Future[Option[ToolJob]]

  def list(orgId: Long, keyword: String, from: Int, size: Int, sortRequests: Seq[SortRequest]): Future[Seq[ToolJob]]

  def count(orgId: Long, keyword: String): Future[Long]

  def create(toolJob: ToolJob): Future[Long]

  def update(newJob: ToolJob): Future[Boolean]

  def delete(orgId: Long, jobId: Long): Future[Boolean]

  def getNextJob(atTime: Long): Future[Option[ToolJob]]

}

case class MySqlToolJobRepository(client: JdbcClient, dbName: String, tblName: String, requiredFields: List[String])
    extends MySqlSchemaManager
    with ToolJobRepository {

  require(ensureSchema().syncGet())

  override def get(orgId: Long, jobId: Long): Future[Option[ToolJob]] =
    Future {
      val query =
        s"""
           |select * from $dbName.$tblName
           |where org_id = ? and job_id = ?
           |""".stripMargin

      val args = Seq(orgId, jobId)

      client.executeQuery(query, args: _*)(rs => toToolJobs(rs).headOption)
    }

  override def list(
      orgId: Long,
      keyword: String,
      from: Int,
      size: Int,
      sortRequests: Seq[SortRequest]
  ): Future[Seq[ToolJob]] =
    Future {
      val orderByQuery = if (sortRequests.nonEmpty) {
        val orderByField = sortRequests.map(field => s"${field.field} ${field.order}").mkString(", ")
        s"order by ${orderByField}"
      } else {
        ""
      }
      val query =
        s"""
         |select * from $dbName.$tblName
         |where org_id = ? and name like ?
         |${orderByQuery}
         |limit ? offset ?
         |""".stripMargin

      val args = Seq(orgId, s"%${keyword}%", size, from)

      client.executeQuery(query, args: _*)(toToolJobs)
    }

  override def count(orgId: Long, keyword: String): Future[Long] =
    Future {
      val query =
        s"""
        |select count(1) from $dbName.$tblName
        |where org_id = ? and name like ?
        |""".stripMargin

      val args = Seq(orgId, s"%${keyword}%")

      client.executeQuery(query, args: _*)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else 0L
      })
    }

  override def create(toolJob: ToolJob): Future[Long] =
    Future {
      val query =
        s"""
        |insert into $dbName.$tblName(
        |  org_id, name, description, job_type, job_data, schedule_time,
        |  last_run_time, last_run_status, next_run_time, current_run_status,
        |  created_by, created_at, updated_by, updated_at
        |)
        |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        |""".stripMargin

      val args = Seq(
        toolJob.orgId,
        toolJob.name,
        toolJob.description,
        toolJob.jobType,
        JsonParser.toJson(toolJob.jobData),
        JsonParser.toJson(toolJob.scheduleTime),
        toolJob.lastRunTime,
        toolJob.lastRunStatus,
        toolJob.nextRunTime,
        toolJob.currentRunStatus,
        toolJob.createdBy,
        toolJob.createdAt,
        toolJob.updatedBy,
        toolJob.updatedAt
      )

      client.executeInsert(query, args: _*)
    }

  override def update(newJob: ToolJob): Future[Boolean] =
    Future {
      val query =
        s"""
        |update $dbName.$tblName
        |set name = ?, description = ?,
        |schedule_time = ?, job_data = ?,
        |last_run_time = ?, last_run_status = ?,
        |next_run_time = ?, current_run_status = ?,
        |updated_by = ?, updated_at = ?
        |where org_id = ? and job_id = ?
        |""".stripMargin

      val args = Seq(
        newJob.name,
        newJob.description,
        JsonParser.toJson(newJob.scheduleTime),
        JsonParser.toJson(newJob.jobData),
        newJob.lastRunTime,
        newJob.lastRunStatus,
        newJob.nextRunTime,
        newJob.currentRunStatus,
        newJob.updatedBy,
        newJob.updatedAt,
        newJob.orgId,
        newJob.jobId
      )

      client.executeUpdate(query, args: _*) >= 0
    }

  override def delete(orgId: Long, jobId: Long): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where org_id = ? and job_id = ?
         |""".stripMargin

      val args = Seq(orgId, jobId)

      client.executeUpdate(query, args: _*) >= 0
    }

  override def getNextJob(atTime: Long): Future[Option[ToolJob]] =
    Future {
      val query =
        s"""
        |select * from $dbName.$tblName
        |where next_run_time <= ?
        |  and current_run_status != 'Queued'
        |  and current_run_status != 'Running'
        |order by next_run_time asc
        |limit 1
        |""".stripMargin

      val args = Seq(atTime)

      client.executeQuery(query, args: _*)(rs => toToolJobs(rs).headOption)
    }

  override def createTable(): Future[Boolean] =
    Future {
      val query =
        s"""
        |create table if not exists $dbName.$tblName (
        |  job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        |  org_id BIGINT,
        |  name TEXT,
        |  description TEXT,
        |  job_type TINYTEXT,
        |  job_data LONGTEXT,
        |  schedule_time TEXT,
        |  last_run_time BIGINT,
        |  last_run_status TINYTEXT,
        |  next_run_time BIGINT,
        |  current_run_status TINYTEXT,
        |  created_by TINYTEXT,
        |  created_at BIGINT,
        |  updated_by TINYTEXT,
        |  updated_at BIGINT
        |) engine = INNODB;
        |""".stripMargin

      val args = Seq()

      client.executeUpdate(query, args: _*) >= 0
    }

  private def toToolJobs(rs: ResultSet): Seq[ToolJob] = {
    val jobs = ArrayBuffer[ToolJob]()

    while (rs.next()) {
      val toolJob = ToolJob(
        jobId = rs.getLong("job_id"),
        orgId = rs.getLong("org_id"),
        name = rs.getString("name"),
        description = rs.getString("description"),
        jobType = rs.getString("job_type"),
        scheduleTime = JsonParser.fromJson[ScheduleTime](rs.getString("schedule_time")),
        lastRunTime = rs.getLong("last_run_time"),
        lastRunStatus = rs.getString("last_run_status"),
        nextRunTime = rs.getLong("next_run_time"),
        currentRunStatus = rs.getString("current_run_status"),
        jobData = JsonParser.fromJson[Map[String, Any]](rs.getString("job_data")),
        createdBy = rs.getString("created_by"),
        createdAt = rs.getLong("created_at"),
        updatedBy = rs.getString("updated_by"),
        updatedAt = rs.getLong("updated_at")
      )

      jobs += toolJob
    }

    jobs
  }

}

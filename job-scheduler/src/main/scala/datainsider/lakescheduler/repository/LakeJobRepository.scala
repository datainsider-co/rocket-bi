package datainsider.lakescheduler.repository

import com.twitter.util.Future
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.request.SortRequest
import datainsider.jobscheduler.repository.MySqlSchemaManager
import datainsider.jobscheduler.util.JsonUtils
import datainsider.lakescheduler.domain.job.LakeJobType.LakeJobType
import datainsider.lakescheduler.domain.job.{JavaJob, LakeJob, LakeJobType, SqlJob}

import java.sql.ResultSet
import javax.inject.Inject
import scala.collection.mutable.ArrayBuffer

trait LakeJobRepository {
  def insert(orgId: Long, job: LakeJob): Future[JobId]

  def count(orgId: Long, keyword: String): Future[Long]

  def delete(orgId: Long, jobId: JobId): Future[Boolean]

  def update(orgId: Long, job: LakeJob): Future[Boolean]

  def get(orgId: Long, jobId: JobId): Future[Option[LakeJob]]

  def list(orgId: Long, keyword: String, from: Int, size: Int, sorts: Seq[SortRequest]): Future[Seq[LakeJob]]

  def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[LakeJob]]

  def getNextJob: Future[Option[LakeJob]]
}

class MysqlLakeJobRepository @Inject() (
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val requiredFields: List[String]
) extends MySqlSchemaManager
    with LakeJobRepository {

  override def insert(orgId: JobId, job: LakeJob): Future[JobId] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName
         |(organization_id, name, job_type, last_run_time, next_run_time, last_run_status, current_job_status, creator_id, job_data)
         |values (?, ?, ?, ?, ?, ?, ?, ?, ?);
         |""".stripMargin

      client.executeInsert(
        query,
        orgId,
        job.name,
        job.jobType.toString,
        job.lastRunTime,
        job.nextRunTime,
        job.lastRunStatus.toString,
        job.currentJobStatus.toString,
        job.creatorId,
        JsonUtils.toJson(job.jobData)
      )
    }

  override def count(orgId: JobId, keyword: String): Future[JobId] =
    Future {
      val query = s"select count(*) from $dbName.$tblName where organization_id = ? and name like ?;"
      client.executeQuery(query, orgId, s"%$keyword%")(rs => {
        if (rs.next()) rs.getLong(1)
        else 0
      })
    }

  override def delete(orgId: JobId, jobId: JobId): Future[Boolean] =
    Future {
      val query = s"delete from $dbName.$tblName where id = ?"
      client.executeUpdate(query, jobId) >= 0
    }

  override def update(orgId: JobId, job: LakeJob): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set name = ?, job_type = ?, last_run_time = ?, next_run_time = ?, last_run_status = ?, current_job_status = ?, job_data = ?
         |where organization_id = ? and id = ?;
         |""".stripMargin

      client.executeUpdate(
        query,
        job.name,
        job.jobType.toString,
        job.lastRunTime,
        job.nextRunTime,
        job.lastRunStatus.toString,
        job.currentJobStatus.toString,
        JsonUtils.toJson(job.jobData),
        orgId,
        job.jobId
      ) >= 0
    }

  override def get(orgId: JobId, jobId: JobId): Future[Option[LakeJob]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName where organization_id = ? and id = ?
         |""".stripMargin

      client.executeQuery(query, orgId, jobId)(toJobs).headOption
    }

  override def list(
      orgId: JobId,
      keyword: String,
      from: Int,
      size: Int,
      sorts: Seq[SortRequest]
  ): Future[Seq[LakeJob]] =
    Future {

      val orderStatement: String =
        if (sorts.nonEmpty) {
          "order by " + sorts.map(sort => s"${sort.field} ${sort.order}").mkString(",")
        } else {
          ""
        }

      val query =
        s"""
         |select * from $dbName.$tblName
         |where organization_id = ? and name like ?
         |$orderStatement
         |limit ? offset ?;
         |""".stripMargin

      client.executeQuery(query, orgId, s"%$keyword%", size, from)(toJobs)
    }

  override def getWith(orgId: JobId, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[LakeJob]] =
    Future {
      if (jobStatus.isEmpty) return Future(List.empty)
      val questionMarkHolder: String = List.fill(jobStatus.size)("?").mkString(",")
      val query =
        s"""
         |select * from $dbName.$tblName
         |where current_job_status in ($questionMarkHolder) and organization_id = $orgId
         |limit $size offset $from;
         |""".stripMargin
      client.executeQuery(query, jobStatus.map(_.toString): _*)(
        toJobs
      )
    }

  override def getNextJob: Future[Option[LakeJob]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |where unix_timestamp() * 1000 >= next_run_time
         |and current_job_status != 'Queued'
         |and current_job_status != 'Running'
         |and current_job_status != 'Compiling'
         |order by next_run_time ASC;
         |""".stripMargin

      client.executeQuery(query)(rs => {
        val jobs = toJobs(rs)
        jobs.headOption
      })
    }

  private def toJobs(rs: ResultSet): Seq[LakeJob] = {
    val jobs = ArrayBuffer.empty[LakeJob]
    while (rs.next()) {
      val jobType: LakeJobType = LakeJobType.withName(rs.getString("job_type"))
      val job: LakeJob = jobType match {
        case LakeJobType.Java => JavaJob.fromResultSet(rs)
        case LakeJobType.Sql  => SqlJob.fromResultSet(rs)
        case _                => throw new UnsupportedOperationException
      }
      jobs += job
    }
    jobs
  }

  /** *
    * create schema for a specific table, function to be implemented by child classes
    *
    * @return true if schema is ready to use, false otherwise
    */
  override def createTable(): Future[Boolean] =
    Future {
      val query =
        s"""
         |create table if not exists $dbName.$tblName (
         |organization_id INT,
         |id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |name TEXT,
         |job_type TINYTEXT,
         |last_run_time BIGINT,
         |next_run_time BIGINT DEFAULT 0,
         |last_run_status TINYTEXT,
         |current_job_status TINYTEXT,
         |job_data TEXT,
         |creator_id TEXT
         |) ENGINE=INNODB;
         |""".stripMargin

      client.executeUpdate(query) >= 0
    }
}

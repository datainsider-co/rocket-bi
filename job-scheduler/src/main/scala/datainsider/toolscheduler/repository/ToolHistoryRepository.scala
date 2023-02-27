package datainsider.toolscheduler.repository

import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.domain.request.SortRequest
import datainsider.jobscheduler.repository.MySqlSchemaManager
import datainsider.toolscheduler.domain.ToolJobHistory

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait ToolHistoryRepository {

  def get(orgId: Long, runId: Long): Future[Option[ToolJobHistory]]

  def list(orgId: Long, keyword: String, from: Int, size: Int, sorts: Seq[SortRequest]): Future[Seq[ToolJobHistory]]

  def count(orgId: Long, keyword: String): Future[Long]

  def create(jobHistory: ToolJobHistory): Future[Long]

  def update(newHistory: ToolJobHistory): Future[Boolean]

}

case class MySqlToolHistoryRepository(client: JdbcClient, dbName: String, tblName: String, requiredFields: List[String])
    extends MySqlSchemaManager
    with ToolHistoryRepository {

  require(ensureSchema().syncGet(), "invalid schema")

  override def get(orgId: Long, runId: Long): Future[Option[ToolJobHistory]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |where org_id = ? and run_id = ?
         |""".stripMargin

      val args = Seq(orgId, runId)

      client.executeQuery(query, args: _*)(rs => toHistories(rs).headOption)
    }

  override def list(
      orgId: Long,
      keyword: String,
      from: Int,
      size: Int,
      sorts: Seq[SortRequest]
  ): Future[Seq[ToolJobHistory]] =
    Future {
      val orderByQuery = if (sorts.nonEmpty) {
        val orderByField = sorts.map(field => s"${field.field} ${field.order}").mkString(", ")
        s"order by ${orderByField}"
      } else {
        ""
      }
      val query =
        s"""
        |select * from $dbName.$tblName
        |where org_id = ? and job_name like ?
        |${orderByQuery}
        |limit ? offset ?
        |""".stripMargin

      val args = Seq(orgId, s"%${keyword}%", size, from)

      client.executeQuery(query, args: _*)(toHistories)
    }

  override def count(orgId: Long, keyword: String): Future[Long] =
    Future {
      val query =
        s"""
        |select count(1) from $dbName.$tblName
        |where org_id = ? and job_name like ?
        |""".stripMargin

      val args = Seq(orgId, s"%${keyword}%")

      client.executeQuery(query, args: _*)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else 0L
      })
    }

  override def create(jobHistory: ToolJobHistory): Future[Long] =
    Future {
      val query =
        s"""
        |insert into $dbName.$tblName(org_id, job_id, job_name, job_type, job_status, job_data, history_data, begin_at, end_at, message)
        |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        |""".stripMargin

      val args = Seq(
        jobHistory.orgId,
        jobHistory.jobId,
        jobHistory.jobName,
        jobHistory.jobType,
        jobHistory.jobStatus,
        JsonParser.toJson(jobHistory.jobData),
        JsonParser.toJson(jobHistory.historyData),
        jobHistory.beginAt,
        jobHistory.endAt,
        jobHistory.message
      )

      client.executeInsert(query, args: _*)
    }

  override def update(newHistory: ToolJobHistory): Future[Boolean] =
    Future {
      val query =
        s"""
        |update $dbName.$tblName
        |set job_status = ?, job_data = ?, history_data = ?, end_at = ?, message = ?
        |where org_id = ? and run_id = ?
        |""".stripMargin

      val args = Seq(
        newHistory.jobStatus,
        JsonParser.toJson(newHistory.jobData),
        JsonParser.toJson(newHistory.historyData),
        newHistory.endAt,
        newHistory.message,
        newHistory.orgId,
        newHistory.runId
      )

      client.executeUpdate(query, args: _*) >= 0
    }

  override def createTable(): Future[Boolean] =
    Future {
      val query =
        s"""
         |create table $dbName.$tblName(
         |  run_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         |  org_id BIGINT,
         |  job_id BIGINT,
         |  job_name TEXT,
         |  job_type TINYTEXT,
         |  job_status TINYTEXT,
         |  job_data LONGTEXT,
         |  history_data LONGTEXT,
         |  begin_at BIGINT,
         |  end_at BIGINT,
         |  message TEXT
         |) engine = INNODB;
         |""".stripMargin

      client.executeUpdate(query) >= 0
    }

  private def toHistories(rs: ResultSet): Seq[ToolJobHistory] = {
    val histories = ArrayBuffer[ToolJobHistory]()

    while (rs.next()) {
      val history = ToolJobHistory(
        runId = rs.getLong("run_id"),
        orgId = rs.getLong("org_id"),
        jobId = rs.getLong("job_id"),
        jobName = rs.getString("job_name"),
        jobStatus = rs.getString("job_status"),
        jobType = rs.getString("job_type"),
        jobData = JsonParser.fromJson[Map[String, Any]](rs.getString("job_data")),
        historyData = JsonParser.fromJson[Map[String, Any]](rs.getString("history_data")),
        beginAt = rs.getLong("begin_at"),
        endAt = rs.getLong("end_at"),
        message = rs.getString("message")
      )

      histories += history
    }

    histories
  }

}

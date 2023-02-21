package datainsider.data_cook.repository

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import datainsider.client.exception.NotFoundError
import datainsider.client.util.{JdbcClient, JsonParser, TimeUtils, ZConfig}
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId, UserId}
import datainsider.data_cook.domain.request.EtlRequest.{CreateEtlJobRequest, ListEtlJobsRequest}
import datainsider.data_cook.domain.{EtlJob, EtlJobStatus}
import datainsider.ingestion.controller.http.requests.PermResourceType

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait EtlJobRepository {

  def insert(organizationId: OrganizationId, request: CreateEtlJobRequest): Future[EtlJobId]

  def insert(etlJob: EtlJob): Future[EtlJobId]

  def restore(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean]

  def list(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])]

  /**
    * list all etl jobs of systems
    */
  def list(from: Long, size: Long): Future[Seq[EtlJob]]

  def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob]

  def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Seq[EtlJob]]

  def update(job: EtlJob): Future[Boolean]

  def delete(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  def createDatabase(): Future[Boolean]

  def createTable(): Future[Boolean]

  def count(organizationId: OrganizationId, ownerId: String): Future[Long]

  def getNextJob: Future[Option[EtlJob]]

  /**
    * migrate data update operators to operator info
    */
  def migrateData(jobs: Seq[EtlJob]): Future[Unit]

  def fixJosStatuses(): Future[Boolean]

  def transferOwner(organizationId: OrganizationId, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean]

  def listSharedJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])]
}

class EtlJobRepositoryImpl(client: JdbcClient, dbName: String, tblName: String, shareTblName: String) extends EtlJobRepository {
  import EtlJob.EnhanceImplicitResultSet

  override def insert(organizationId: OrganizationId, request: CreateEtlJobRequest): Future[EtlJobId] =
    Future {
      val query =
        s"""
        |INSERT INTO $dbName.$tblName
        |(organization_id, display_name, operators, schedule_time, owner_id, created_time, updated_time, next_execute_time, job_status, extra_data, operator_info, config)
        |values (?,?,?,?,?,?,?,?,?,?,?,?)
        |""".stripMargin
      val scheduleTime: ScheduleTime = request.scheduleTime.getOrElse(NoneSchedule())
      client.executeInsert(
        query,
        organizationId,
        request.displayName,
        JsonParser.toJson(request.operators, false),
        JsonParser.toJson(scheduleTime, false),
        request.currentUsername,
        System.currentTimeMillis(),
        System.currentTimeMillis(),
        TimeUtils.calculateNextRunTime(scheduleTime, None),
        EtlJobStatus.Init.toString,
        request.extraData.map((data: JsonNode) => JsonParser.toJson(data, false)).orNull,
        JsonParser.toJson(request.toOperatorInfo(), false),
        JsonParser.toJson(request.config, false)
      )
    }

  override def restore(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName
         |(organization_id, id, display_name, operators, schedule_time, owner_id, created_time, updated_time, next_execute_time, last_execute_time, job_status, last_history_id, extra_data, operator_info, config)
         |values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         |""".stripMargin
      client.executeUpdate(
        query,
        organizationId,
        etlJob.id,
        etlJob.displayName,
        JsonParser.toJson(etlJob.operators, false),
        JsonParser.toJson(etlJob.scheduleTime, false),
        etlJob.ownerId,
        etlJob.createdTime.getOrElse(System.currentTimeMillis()),
        etlJob.updatedTime.getOrElse(System.currentTimeMillis()),
        etlJob.nextExecuteTime,
        etlJob.lastExecuteTime.orNull,
        etlJob.status.toString,
        etlJob.lastHistoryId.orNull,
        etlJob.extraData.map((data: JsonNode) => JsonParser.toJson(data, false)).orNull,
        JsonParser.toJson(etlJob.operatorInfo, false),
        JsonParser.toJson(etlJob.config, false)
      ) > 0
    }

  override def list(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])] =
    Future {
      val total: Long = countEtlJobs(organizationId, request)
      val orderByStatement: String =
        if (request.sorts.nonEmpty)
          s"order by ${request.sorts.map(sort => s"${sort.field} ${sort.order.toString}").mkString(", ")}"
        else
          ""
      val query =
        s"""
         |SELECT *
         |FROM (
         |  select * from $dbName.$tblName
         |  where (organization_id = ? and owner_id = ?)
         |    or id in (
         |      SELECT resource_id
         |      FROM $dbName.$shareTblName
         |      WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ?
         |    )
         |) etl_job
         |WHERE display_name like ?
         |$orderByStatement
         |limit ? offset ?
         |""".stripMargin

      val etlJobs: Seq[EtlJob] = client.executeQuery(
        query,
        organizationId,
        request.currentUsername,
        organizationId,
        PermResourceType.ETL.toString,
        request.currentUsername,
        s"%${request.keyword}%",
        request.size,
        request.from
      )(toEtlJobs)
      (total, etlJobs)
    }

  private def countEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Long = {
    val query =
      s"""
         |SELECT count(1)
         |FROM (
         |  select * from $dbName.$tblName
         |  where (organization_id = ? and owner_id = ?)
         |    or id in (
         |      SELECT resource_id
         |      FROM $dbName.$shareTblName
         |      WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ?
         |    )
         |) etl_job
         |WHERE display_name like ?
         |""".stripMargin

    client.executeQuery(
      query,
      organizationId,
      request.currentUsername,
      organizationId,
      PermResourceType.ETL.toString,
      request.currentUsername,
      s"%${request.keyword}%"
    )(rs => {
      if (rs.next()) rs.getLong(1)
      else 0
    })
  }

  private def toEtlJobs(rs: ResultSet): Seq[EtlJob] = {
    val jobs = ArrayBuffer.empty[EtlJob]
    while (rs.next()) {
      val job: EtlJob = rs.toEtlJob
      jobs += job
    }
    jobs
  }

  override def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |where id = ? and organization_id = ?
         |""".stripMargin
      client.executeQuery(query, id, organizationId)(toEtlJob)
    }

  private def toEtlJob(rs: ResultSet): EtlJob = {
    if (rs.next()) {
      rs.toEtlJob
    } else {
      throw NotFoundError("not found etl job")
    }
  }

  override def delete(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] =
    Future {
      val query =
        s"""
         |delete from $dbName.$tblName
         |where id = ? and organization_id = ?
         |""".stripMargin

      client.executeUpdate(query, id, organizationId) >= 0
    }

  override def createDatabase(): Future[Boolean] =
    Future {
      val query =
        s"""
        |create database if not exist $dbName
        |""".stripMargin
      client.executeUpdate(query) >= 0
    }

  override def createTable(): Future[Boolean] =
    Future {
      val query =
        s"""
        |create table $dbName.$tblName (
        |organization_id INT,
        |id BIGINT AUTO_INCREMENT PRIMARY KEY,
        |display_name TEXT,
        |operators TEXT,
        |schedule_time TEXT,
        |owner_id TEXT,
        |created_time BIGINT,
        |updated_time BIGINT,
        |next_execute_time BIGINT,
        |last_execute_time BIGINT,
        |job_status TEXT,
        |last_history_id BIGINT default null,
        |extra_data TEXT,
        |`operator_info` LONGTEXT,
        |`config` LONGTEXT
        |) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;
        |""".stripMargin

      client.executeUpdate(query) >= 0
    }

  override def count(organizationId: OrganizationId, ownerId: String): Future[Long] =
    Future {
      val query =
        s"""
         |select count(*)
         |from $dbName.$tblName
         |where organization_id = ? and owner_id = ?
         |""".stripMargin

      client.executeQuery(query, organizationId, ownerId)(rs => {
        if (rs.next()) rs.getLong(1)
        else 0
      })
    }

  override def update(job: EtlJob): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set display_name = ?, operators = ?, schedule_time = ?, updated_time = ?, owner_id = ?, next_execute_time = ?, last_execute_time = ?, job_status = ?, last_history_id = ?, extra_data = ?,
         |operator_info = ?, config = ?
         |where id = ?
         |""".stripMargin
      client.executeUpdate(
        query,
        job.displayName,
        JsonParser.toJson(job.operators, false),
        JsonParser.toJson(job.scheduleTime, false),
        System.currentTimeMillis(),
        job.ownerId,
        job.nextExecuteTime,
        job.lastExecuteTime.orNull,
        job.status.toString,
        job.lastHistoryId.orNull,
        job.extraData.map((data: JsonNode) => JsonParser.toJson(data, false)).orNull,
        JsonParser.toJson(job.operatorInfo, false),
        JsonParser.toJson(job.config, false),
        job.id
      ) >= 0
    }

  override def getNextJob: Future[Option[EtlJob]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |where unix_timestamp() * 1000 >= next_execute_time
         |and job_status != ?
         |and job_status != ?
         |order by next_execute_time ASC;
         |""".stripMargin

      client.executeQuery(query, EtlJobStatus.Queued.toString, EtlJobStatus.Running.toString)(toEtlJobs).headOption
    }

  override def insert(etlJob: EtlJob): Future[EtlJobId] =
    Future {
      client.executeInsert(
        s"""
         |insert into $dbName.$tblName
         |(organization_id, display_name, operators, schedule_time, owner_id, created_time, updated_time, next_execute_time, last_execute_time, job_status, last_history_id, extra_data, operator_info, config)
         |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         |""".stripMargin,
        etlJob.organizationId,
        etlJob.displayName,
        JsonParser.toJson(etlJob.operators),
        JsonParser.toJson(etlJob.scheduleTime),
        etlJob.ownerId,
        etlJob.createdTime.getOrElse(System.currentTimeMillis()),
        etlJob.updatedTime.getOrElse(System.currentTimeMillis()),
        etlJob.nextExecuteTime,
        etlJob.lastExecuteTime.orNull,
        etlJob.status.toString,
        etlJob.lastHistoryId.orNull,
        etlJob.extraData.map((data: JsonNode) => JsonParser.toJson(data)).orNull,
        JsonParser.toJson(etlJob.operatorInfo, false),
        JsonParser.toJson(etlJob.config, false)
      )
    }

  override def multiGet(organizationId: OrganizationId, ids: Seq[EtlJobId]): Future[Seq[EtlJob]] =
    Future {
      client.executeQuery(
        s"""
        |select * from $dbName.$tblName
        |where organization_id = ?
        |and id in (${createParams(ids.size)})
        |""".stripMargin,
        (Seq(organizationId) ++ ids): _*
      )(toEtlJobs)
    }

  private def createParams(size: Int): String = {
    Array.fill(size)("?").mkString(",")
  }

  /**
    * list all etl jobs for the organization
    */
  override def list(from: Long, size: Long): Future[Seq[EtlJob]] =
    Future {
      val query =
        s"""
         |select * from $dbName.$tblName
         |limit ? offset ?
         |""".stripMargin

      val data: Seq[EtlJob] = client.executeQuery(
        query,
        size,
        from
      )(toEtlJobs)
      data
    }

  override def migrateData(jobs: Seq[EtlJob]): Future[Unit] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set operator_info = ?, config = ?
         |where id = ? and organization_id = ?
         |""".stripMargin

      val records: Seq[Seq[Any]] = jobs.map(job =>
        Seq(
          JsonParser.toJson(job.operatorInfo, false),
          JsonParser.toJson(job.config, false),
          job.id,
          job.organizationId
        )
      )

      client.executeBatchUpdate(query, records)
    }

  override def fixJosStatuses(): Future[Boolean] = {
    Future {
      val query =
        s"""
           |update $dbName.$tblName
           |set job_status = ?
           |where job_status = ? || job_status = ?
           |""".stripMargin

      client.executeUpdate(
        query,
        EtlJobStatus.Terminated.toString,
        EtlJobStatus.Running.toString,
        EtlJobStatus.Queued.toString
      ) >= 0
    }
  }

  override def transferOwner(
      organizationId: OrganizationId,
      fromUsername: UserId,
      toUsername: UserId
  ): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set owner_id = ?
         |where organization_id = ? and owner_id = ?
         |""".stripMargin
      client.executeUpdate(query, toUsername, organizationId, fromUsername) >= 0
    }

  def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean] =
    Future {
      val query =
        s"""
           |delete from $dbName.$tblName
           |where organization_id = ? and owner_id = ?
           |""".stripMargin
      client.executeUpdate(query, organizationId, userId) >= 0
    }

  override def listSharedJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(EtlJobId, Seq[EtlJob])] = Future {
    val total: Long = countSharedEtlJobs(organizationId, request)
    val orderByStatement: String =
      if (request.sorts.nonEmpty)
        s"order by ${request.sorts.map(sort => s"${sort.field} ${sort.order.toString}").mkString(", ")}"
      else
        ""
    val query =
      s"""
         |SELECT *
         |FROM (
         |  select * from $dbName.$tblName
         |  where id in (
         |      SELECT resource_id
         |      FROM $dbName.$shareTblName
         |      WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ?
         |  )
         |) etl_job
         |WHERE display_name like ?
         |$orderByStatement
         |limit ? offset ?
         |""".stripMargin

    val sharedJobs: Seq[EtlJob] = client.executeQuery(
      query,
      organizationId,
      PermResourceType.ETL.toString,
      request.currentUsername,
      s"%${request.keyword}%",
      request.size,
      request.from
    )(toEtlJobs)
    (total, sharedJobs)
  }

  private def countSharedEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Long = {
    val query: String =
      s"""
         |SELECT count(1)
         |FROM (
         |  select * from $dbName.$tblName
         |  where id in (
         |      SELECT resource_id
         |      FROM $dbName.$shareTblName
         |      WHERE is_deleted = FALSE AND organization_id = ? AND resource_type = ? AND username = ?
         |  )
         |) etl_job
         |WHERE display_name like ?
         |""".stripMargin

    client.executeQuery(
      query,
      organizationId,
      PermResourceType.ETL.toString,
      request.currentUsername,
      s"%${request.keyword}%"
    )(rs => {
      if (rs.next()) rs.getLong(1)
      else 0
    })
  }
}

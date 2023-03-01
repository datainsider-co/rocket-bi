package datainsider.data_cook.repository

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import datainsider.client.domain.scheduler.NoneSchedule
import datainsider.client.exception.NotFoundError
import datainsider.client.util.{JdbcClient, JsonParser}
import datainsider.data_cook.domain.EtlJob.EnhanceImplicitResultSet
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId, UserId}
import datainsider.data_cook.domain.request.EtlRequest.ListEtlJobsRequest
import datainsider.data_cook.domain.{EtlConfig, EtlJob, EtlJobStatus, OperatorInfo}

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait TrashEtlJobRepository {
  def insert(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean]

  def list(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])]

  def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob]

  def delete(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  def count(organizationId: OrganizationId, ownerId: String): Future[Long]

  /**
    * list all etl jobs of systems
    */
  def list(from: Long, size: Long): Future[Seq[EtlJob]]

  def migrateData(jobs: Seq[EtlJob]): Future[Unit]

  def transferOwner(organizationId: OrganizationId, fromUsername: UserId, toUsername: UserId): Future[Boolean]

  def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean]
}

class MockDeletedEtlJobRepository extends TrashEtlJobRepository {
  override def insert(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean] = Future.True

  override def list(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])] =
    Future(0, Nil)

  override def get(organizationId: OrganizationId, id: EtlJobId): Future[EtlJob] =
    Future.value(
      EtlJob(
        id,
        organizationId = organizationId,
        displayName = "Mock",
        operators = Array.empty,
        ownerId = "mock_user",
        scheduleTime = NoneSchedule(),
        nextExecuteTime = 0L,
        status = EtlJobStatus.Done,
        createdTime = Some(System.currentTimeMillis()),
        updatedTime = Some(System.currentTimeMillis()),
        lastHistoryId = None,
        operatorInfo = OperatorInfo.default(),
        config = EtlConfig()
      )
    )

  override def delete(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = Future.True

  override def count(organizationId: OrganizationId, ownerId: String): Future[EtlJobId] = Future.value(0L)

  /**
    * list all etl jobs of systems
    */
  override def list(from: EtlJobId, size: EtlJobId): Future[Seq[EtlJob]] = Future.Nil

  override def migrateData(jobs: Seq[EtlJob]): Future[Unit] = Future.Unit

  override def transferOwner(organizationId: EtlJobId, fromUsername: UserId, toUsername: UserId): Future[Boolean] =
    Future.True

  override def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean] = Future.True
}

class DeletedEtlJobRepositoryImpl(client: JdbcClient, dbName: String, tblName: String) extends TrashEtlJobRepository {
  override def insert(organizationId: OrganizationId, etlJob: EtlJob): Future[Boolean] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName
         |(organization_id, id, display_name, operators, schedule_time, owner_id, created_time, updated_time, next_execute_time, last_execute_time, job_status, deleted_time, last_history_id, extra_data, operator_info, config)
         |values (?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?)
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
        System.currentTimeMillis(),
        etlJob.lastHistoryId.orNull,
        etlJob.extraData.map((data: JsonNode) => JsonParser.toJson(data, false)).orNull,
        JsonParser.toJson(etlJob.operatorInfo, false),
        JsonParser.toJson(etlJob.config, false)
      ) > 0
    }

  override def list(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[(Long, Seq[EtlJob])] =
    Future {
      val total = countEtlJobs(organizationId, request)
      val orderByStatement: String =
        if (request.sorts.nonEmpty)
          s"order by ${request.sorts.map(sort => s"${sort.field} ${sort.order.toString}").mkString(", ")}"
        else
          ""
      val query =
        s"""
         |select * from $dbName.$tblName
         |where (display_name like ?) and owner_id = ?
         |$orderByStatement
         |limit ? offset ?
         |""".stripMargin

      val data =
        client.executeQuery(query, s"%${request.keyword}%", request.currentUsername, request.size, request.from)(
          toEtlJobs
        )
      (total, data)
    }

  private def countEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Long = {
    val query =
      s"""
         |select count(*) from $dbName.$tblName
         |where (display_name like ?) and owner_id = ?
         |""".stripMargin

    client.executeQuery(
      query,
      s"%${request.keyword}%",
      request.currentUsername
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

  override def transferOwner(organizationId: OrganizationId, fromUsername: UserId, toUsername: UserId): Future[Boolean] =
    Future {
      val query =
        s"""
           |update $dbName.$tblName
           |set owner_id = ?
           |where organization_id = ? and owner_id = ?
           |""".stripMargin

      client.executeUpdate(query, toUsername, organizationId, fromUsername) > 0
    }

  def deleteByOwnerId(organizationId: OrganizationId, userId: UserId): Future[Boolean] = Future {
    val query =
      s"""
         |delete from $dbName.$tblName
         |where organization_id = ? and owner_id = ?
         |""".stripMargin

    client.executeUpdate(query, organizationId, userId) > 0
  }
}

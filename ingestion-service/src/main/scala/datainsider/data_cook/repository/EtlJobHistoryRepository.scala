package datainsider.data_cook.repository

import com.twitter.util.Future
import datainsider.client.exception.NotFoundError
import datainsider.client.util.{JdbcClient, JsonParser}
import datainsider.data_cook.domain.Ids.{JobHistoryId, OrganizationId}
import datainsider.data_cook.domain.operator.EtlOperator
import datainsider.data_cook.domain.request.EtlRequest.ListEtlJobsRequest
import datainsider.data_cook.domain.request.Sort
import datainsider.data_cook.domain.{EtlJobStatus, EtlJobHistory}
import datainsider.data_cook.pipeline.operator.Operator
import datainsider.ingestion.domain.{PageResult, TableSchema}

import java.sql.ResultSet
import javax.inject.Inject
import scala.collection.mutable.ArrayBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 10/13/2021 - 3:00 PM
  */
trait EtlJobHistoryRepository {

  /**
    * List histories theo key word và được sort theo field
    * Nếu keyword empty thì sẽ trả về toàn bộ kết quả
    */
  def listHistories(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobHistory]]

  def insert(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[JobHistoryId]

  def update(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[Boolean]

  def get(organizationId: OrganizationId, id: JobHistoryId): Future[EtlJobHistory]
}

class EtlJobHistoryRepositoryImpl (client: JdbcClient, dbName: String, tblName: String)
    extends EtlJobHistoryRepository {

  /**
    * List histories theo key word và được sort theo field
    * Nếu keyword empty thì sẽ trả về toàn bộ kết quả
    */
  override def listHistories(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobHistory]] = {
    for {
      histories <- list(organizationId, request)
      total <- count(organizationId, request)
    } yield PageResult(total = total, data = histories)
  }

  def buildOrderByStatement(sorts: Array[Sort]): String = {
    if (sorts.nonEmpty)
      s"order by ${sorts.map(sort => s"${sort.field} ${sort.order.toString}").mkString(", ")}"
    else
      "order by id desc"
  }

  def toJobHistories(rs: ResultSet): Seq[EtlJobHistory] = {
    val jobs = ArrayBuffer.empty[EtlJobHistory]
    while (rs.next()) {
      val jobHistory: EtlJobHistory = getJobHistory(rs)
      jobs += jobHistory
    }
    jobs.toSeq
  }

  def list(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[Seq[EtlJobHistory]] =
    Future {
      client.executeQuery(
        s"""
        |select *
        |from $dbName.$tblName
        |where organization_id = ? and owner_id = ?
        |${buildOrderByStatement(request.sorts)}
        |limit ? offset ?
        |""".stripMargin,
        organizationId,
        request.currentUsername,
        request.size,
        request.from
      )(toJobHistories)
    }

  def count(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[Long] = Future{
    client.executeQuery(
      s"""
         |select count(*) as total
         |from $dbName.$tblName
         |where organization_id = ? and owner_id = ?
         |""".stripMargin,
      organizationId,
      request.currentUsername,
    )(rs => {
      if (rs.next()) {
        rs.getLong("total")
      } else {
        0L
      }
    })
  }

  override def insert(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[JobHistoryId] =
    Future {
      client.executeInsert(
        s"""
         |insert into $dbName.$tblName
         |(organization_id, etl_job_id, total_execution_time, message, owner_id, status, created_time, updated_time)
         |values (?, ?, ?, ?, ?, ?, ?, ?)
         |""".stripMargin,
        organizationId,
        jobHistory.etlJobId,
        jobHistory.totalExecutionTime,
        jobHistory.message.orNull,
        jobHistory.ownerId,
        jobHistory.status.toString,
        System.currentTimeMillis(),
        System.currentTimeMillis()
      )
    }

  override def update(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |UPDATE $dbName.$tblName
         |SET
         |    total_execution_time = ?,
         |    message = ?,
         |    updated_time = ?,
         |    operator_error= ?,
         |    table_schemas = ?,
         |    status = ?
         |WHERE
         |    id = ? and organization_id = ?
         |""".stripMargin,
        jobHistory.totalExecutionTime,
        jobHistory.message.orNull,
        jobHistory.updatedTime,
        jobHistory.operatorError.map(JsonParser.toJson(_)).orNull,
        JsonParser.toJson(jobHistory.tableSchemas),
        jobHistory.status.toString,
        jobHistory.id,
        jobHistory.organizationId
      ) > 0
    }

  def getJobHistory(rs: ResultSet): EtlJobHistory = {

    val tableSchemas: Option[Array[TableSchema]] = Option(rs.getString("table_schemas")) match {
      case Some(text) => Some(JsonParser.fromJson[Seq[TableSchema]](text).toArray)
      case _          => None
    }

    val operatorError: Option[Operator] = Option(rs.getString("operator_error")) match {
      case Some(text) => Some(JsonParser.fromJson[Operator](text))
      case _          => None
    }

    EtlJobHistory(
      id = rs.getLong("id"),
      organizationId = rs.getLong("organization_id"),
      etlJobId = rs.getLong("etl_job_id"),
      totalExecutionTime = rs.getLong("total_execution_time"),
      status = EtlJobStatus.withName(rs.getString("status")),
      message = Option(rs.getString("message")),
      ownerId = rs.getString("owner_id"),
      createdTime = rs.getLong("created_time"),
      updatedTime = rs.getLong("updated_time"),
      operatorError = operatorError,
      tableSchemas = tableSchemas
    )
  }

  override def get(organizationId: OrganizationId, id: JobHistoryId): Future[EtlJobHistory] =
    Future {
      client.executeQuery(
        s"""
        |select *
        |from $dbName.$tblName
        |where id = ? and organization_id = ?
        |""".stripMargin,
        id,
        organizationId
      )(rs => {
        if (rs.next()) {
          getJobHistory(rs)
        } else {
          throw NotFoundError(s"not found job history ${id}")
        }
      })
    }
}

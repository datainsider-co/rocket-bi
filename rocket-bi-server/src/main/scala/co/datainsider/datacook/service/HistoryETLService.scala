package co.datainsider.datacook.service

import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId}
import co.datainsider.datacook.domain.MockData.mockHistoryData
import co.datainsider.datacook.domain.request.etl.ListEtlJobsRequest
import co.datainsider.datacook.domain.response.{EtlJobHistoryResponse, EtlJobResponse}
import co.datainsider.datacook.domain.{EtlJobHistory, ETLStatus}
import co.datainsider.datacook.repository.HistoryETLRepository
import co.datainsider.schema.domain.PageResult
import com.twitter.util.Future

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 1:40 PM
  */

/**
  * Liên quan đến xử lý history cho etl
  */
trait HistoryETLService {

  /**
    * List histories theo key word và được sort theo field
    * Nếu keyword empty thì sẽ trả về toàn bộ kết quả
    */
  def listHistories(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobHistoryResponse]]

  def createHistory(
      organizationId: OrganizationId,
      etlId: EtlJobId,
      ownerId: String,
      status: ETLStatus = ETLStatus.Queued
  ): Future[EtlJobHistory]

  def update(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[EtlJobHistory]

  def get(organizationId: OrganizationId, id: JobHistoryId): Future[EtlJobHistory]
}

class MockHistoryETLService extends HistoryETLService {

  /**
    * List histories theo key word và được sort theo field
    * Nếu keyword empty thì sẽ trả về toàn bộ kết quả
    */
  override def listHistories(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobHistoryResponse]] = Future.value(mockHistoryData)

  def createHistory(
      organizationId: OrganizationId,
      etlId: EtlJobId,
      ownerId: String,
      status: ETLStatus = ETLStatus.Queued
  ): Future[EtlJobHistory] = Future.value(EtlJobHistory.create(organizationId, etlId, "", ETLStatus.Init))

  def update(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[EtlJobHistory] =
    Future.value(jobHistory)

  override def get(organizationId: OrganizationId, id: JobHistoryId): Future[EtlJobHistory] =
    Future.value(EtlJobHistory.create(organizationId, 123, "", ETLStatus.Init))
}

class HistoryETLServiceImpl @Inject() (repository: HistoryETLRepository, jobService: ETLService)
    extends HistoryETLService {

  def toHistoryResponses(
      organizationId: OrganizationId,
      result: PageResult[EtlJobHistory]
  ): Future[PageResult[EtlJobHistoryResponse]] = {
    val etlJobIds: Seq[EtlJobId] = result.data.map(_.etlJobId).distinct
    for {
      etlResponseAsMap: Map[EtlJobId, EtlJobResponse] <- jobService.multiGet(organizationId, etlJobIds)
      historyResponses = result.data.map(history =>
        EtlJobHistoryResponse(
          id = history.id,
          etlJobId = history.etlJobId,
          totalExecutionTime = history.totalExecutionTime,
          status = history.status,
          message = history.message.getOrElse(""),
          etlInfo = etlResponseAsMap.get(history.etlJobId),
          createdTime = Option(history.createdTime),
          updatedTime = Option(history.updatedTime)
        )
      )
    } yield PageResult(
      total = result.total,
      data = historyResponses
    )
  }

  /**
    * List histories theo key word và được sort theo field
    * Nếu keyword empty thì sẽ trả về toàn bộ kết quả
    */
  override def listHistories(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobHistoryResponse]] = {
    for {
      histories <- repository.listHistories(organizationId, request)
      historyResponse <- toHistoryResponses(organizationId, histories)
    } yield historyResponse
  }

  override def createHistory(
      organizationId: OrganizationId,
      etlId: EtlJobId,
      ownerId: String,
      status: ETLStatus = ETLStatus.Queued
  ): Future[EtlJobHistory] = {
    val newHistory = EtlJobHistory.create(organizationId, etlId, ownerId, status)
    for {
      jobHistoryId <- repository.insert(organizationId, newHistory)
      history <- repository.get(organizationId, jobHistoryId)
    } yield history
  }

  override def update(organizationId: OrganizationId, jobHistory: EtlJobHistory): Future[EtlJobHistory] = {
    for {
      _ <- repository.update(organizationId, jobHistory)
    } yield jobHistory
  }

  override def get(organizationId: OrganizationId, id: JobHistoryId): Future[EtlJobHistory] = {
    repository.get(organizationId, id)
  }
}

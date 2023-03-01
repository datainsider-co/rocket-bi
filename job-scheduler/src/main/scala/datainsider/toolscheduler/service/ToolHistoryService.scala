package datainsider.toolscheduler.service

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobscheduler.domain.request.{PaginationResponse, SortRequest}
import datainsider.toolscheduler.domain.ToolJobHistory
import datainsider.toolscheduler.repository.ToolHistoryRepository

trait ToolHistoryService {
  def list(orgId: Long, keyword: String, from: Int, size: Int, sorts: Seq[SortRequest]): Future[PaginationResponse[ToolJobHistory]]

  def create(jobHistory: ToolJobHistory): Future[ToolJobHistory]

  def update(newJobHistory: ToolJobHistory): Future[Boolean]

}

class ToolHistoryServiceImpl @Inject() (toolHistoryRepository: ToolHistoryRepository) extends ToolHistoryService {
  override def list(orgId: Long, keyword: String, from: Int, size: Int, sorts: Seq[SortRequest]): Future[PaginationResponse[ToolJobHistory]] = {
    for {
      total <- toolHistoryRepository.count(orgId, keyword)
      histories <- toolHistoryRepository.list(orgId, keyword, from, size, sorts)
    } yield PaginationResponse(histories, total)
  }

  override def create(jobHistory: ToolJobHistory): Future[ToolJobHistory] = {
    for {
      createdId <- toolHistoryRepository.create(jobHistory)
      history <- get(jobHistory.orgId, createdId)
    } yield history
  }

  override def update(newJobHistory: ToolJobHistory): Future[Boolean] = {
    toolHistoryRepository.update(newJobHistory)
  }

  private def get(orgId: Long, runId: Long): Future[ToolJobHistory] = {
    toolHistoryRepository.get(orgId, runId).map {
      case Some(history) => history
      case None          => throw BadRequestError(s"not found history for orgId = $orgId, runId = $runId")
    }
  }
}

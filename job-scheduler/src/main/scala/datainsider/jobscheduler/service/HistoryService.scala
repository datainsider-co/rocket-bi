package datainsider.jobscheduler.service

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.jobscheduler.domain.JobHistory
import datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse}
import datainsider.jobscheduler.repository.JobHistoryRepository

trait HistoryService {
  def list(orgId: Long, historyRequest: PaginationRequest): Future[PaginationResponse[JobHistory]]
}

class HistoryServiceImpl @Inject() (historyRepo: JobHistoryRepository) extends HistoryService {

  def list(orgId: Long, req: PaginationRequest): Future[PaginationResponse[JobHistory]] = {
    for {
      records <- historyRepo.get(orgId, req.from, req.size, req.sorts, req.keyword)
      total <- historyRepo.count(orgId, req.keyword)
    } yield PaginationResponse(records, total)
  }

}

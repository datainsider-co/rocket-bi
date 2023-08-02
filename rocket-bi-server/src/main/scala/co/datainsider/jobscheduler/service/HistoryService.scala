package co.datainsider.jobscheduler.service

import co.datainsider.jobscheduler.domain.JobHistory
import co.datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse}
import co.datainsider.jobscheduler.repository.JobHistoryRepository
import com.google.inject.Inject
import com.twitter.util.Future

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

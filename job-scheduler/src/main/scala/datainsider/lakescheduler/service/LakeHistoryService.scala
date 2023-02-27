package datainsider.lakescheduler.service

import com.twitter.util.Future
import datainsider.jobscheduler.domain.request.PaginationResponse
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.domain.LakeJobHistory
import datainsider.lakescheduler.domain.request.ListLakeHistoryRequest
import datainsider.lakescheduler.domain.response.LakeHistoryResponse
import datainsider.lakescheduler.repository.LakeHistoryRepository

import java.nio.file.Paths
import javax.inject.Inject

trait LakeHistoryService {
  def list(orgId: Long, historyRequest: ListLakeHistoryRequest): Future[PaginationResponse[LakeHistoryResponse]]
}

class LakeHistoryServiceImpl @Inject() (
    lakeJobHistoryRepository: LakeHistoryRepository
) extends LakeHistoryService {

  val baseLogDir: String = ZConfig.getString("history_service.hadoop_base_log_dir")

  override def list(orgId: Long, req: ListLakeHistoryRequest): Future[PaginationResponse[LakeHistoryResponse]] = {
    for {
      records <- lakeJobHistoryRepository.get(orgId, req.keyword, req.from, req.size, req.sorts)
      total <- lakeJobHistoryRepository.count(orgId, req.keyword)
    } yield PaginationResponse(toHistoryResponses(records), total)
  }

  private def toHistoryResponses(histories: Seq[LakeJobHistory]): Seq[LakeHistoryResponse] = {
    histories.map(history => {
      val logPath: Option[String] =
        if (history.yarnAppId.nonEmpty) {
          Some(Paths.get(baseLogDir, history.yarnAppId).toString)
        } else None

      LakeHistoryResponse(
        runId = history.runId,
        jobId = history.jobId,
        jobName = history.jobName,
        startTime = history.startTime,
        updatedTime = history.updatedTime,
        endTime = history.endTime,
        jobStatus = history.jobStatus,
        logPath = logPath,
        message = history.message
      )
    })
  }
}

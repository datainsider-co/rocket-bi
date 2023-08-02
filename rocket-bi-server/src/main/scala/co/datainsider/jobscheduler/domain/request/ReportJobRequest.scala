package co.datainsider.jobscheduler.domain.request

import co.datainsider.jobscheduler.domain.JobProgress
import co.datainsider.jobscheduler.domain.response.SyncInfo
import com.twitter.finagle.http.Request

import javax.inject.Inject

case class ReportJobRequest(jobProgress: JobProgress, @Inject request: Request)

case class GetTableSchemaRequest(syncInfo: SyncInfo)

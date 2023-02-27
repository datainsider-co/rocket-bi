package datainsider.jobscheduler.domain.request

import com.twitter.finagle.http.Request
import datainsider.client.domain.schema.TableSchema
import datainsider.jobscheduler.domain.response.SyncInfo
import datainsider.jobscheduler.domain.{JobHistory, JobProgress}

import javax.inject.Inject

case class ReportJobRequest(jobProgress: JobProgress, @Inject request: Request)

case class GetTableSchemaRequest(syncInfo: SyncInfo)

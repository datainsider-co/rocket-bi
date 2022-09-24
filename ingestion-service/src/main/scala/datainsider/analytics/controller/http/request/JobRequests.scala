package datainsider.analytics.controller.http.request

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.Min
import datainsider.analytics.domain.ReportType.ReportType
import datainsider.analytics.domain.ReportTypeTypeRef
import datainsider.ingestion.controller.http.requests.PagingRequest

case class GetScheduleRequest(
    @QueryParam @Min(0) from: Int,
    @QueryParam @Min(1) size: Int,
    @Inject request: Request = null
) extends PagingRequest {}

case class ListJobRequest(
    @QueryParam @Min(0) from: Int,
    @QueryParam @Min(1) size: Int,
    @Inject request: Request = null
) extends PagingRequest {}

case class RunReportRequest(
    organizationId: Long,
    @JsonScalaEnumeration(classOf[ReportTypeTypeRef])
    reportType: ReportType,
    fromDate: String,
    toDate: String
)

case class GetJobRequest(@RouteParam jobId: String)

package co.datainsider.jobworker.client.mixpanel

import java.sql.Date

case class GetEngagementRequest(
    projectId: String,
    sessionId: Option[String] = None,
    page: Option[Int] = None
)

case class ExportRequest(
    projectId: String,
    fromDate: Date,
    toDate: Date
)

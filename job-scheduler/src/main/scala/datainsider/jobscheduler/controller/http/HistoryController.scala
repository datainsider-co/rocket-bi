package datainsider.jobscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.PermissionFilter
import datainsider.jobscheduler.domain.request.PaginationRequest
import datainsider.jobscheduler.service.HistoryService

class HistoryController @Inject() (historyService: HistoryService, permissionFilter: PermissionFilter) extends Controller {

  filter(permissionFilter.require("ingestion_history:view:*"))
  .post("/history/list") { request: PaginationRequest =>
    request.currentOrganizationId match {
      case Some(orgId) => historyService.list(orgId, request)
      case None        => throw UnAuthorizedError("Not found org id")
    }
  }
}

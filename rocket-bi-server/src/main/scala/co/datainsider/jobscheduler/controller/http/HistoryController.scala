package co.datainsider.jobscheduler.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.jobscheduler.domain.request.PaginationRequest
import co.datainsider.jobscheduler.service.HistoryService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.exception.UnAuthorizedError
import co.datainsider.license.domain.LicensePermission

class HistoryController @Inject() (historyService: HistoryService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.requireAll("ingestion_history:view:*", LicensePermission.ViewData))
    .post("/history/list") { request: PaginationRequest =>
      Profiler("/history/list") {
        request.currentOrganizationId match {
          case Some(orgId) => historyService.list(orgId, request)
          case None        => throw UnAuthorizedError("Not found org id")
        }
      }
    }
}

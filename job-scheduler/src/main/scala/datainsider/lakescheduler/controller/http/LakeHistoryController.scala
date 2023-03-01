package datainsider.lakescheduler.controller.http

import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.jobscheduler.domain.request.PaginationRequest
import datainsider.lakescheduler.domain.request.ListLakeHistoryRequest
import datainsider.lakescheduler.service.LakeHistoryService

import javax.inject.Inject

class LakeHistoryController @Inject() (lakeHistoryService: LakeHistoryService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.require("lake_history:view:*"))
    .post("/lake/history/list") { request: ListLakeHistoryRequest =>
      lakeHistoryService.list(request.currentOrganizationId.get, request)
    }
}

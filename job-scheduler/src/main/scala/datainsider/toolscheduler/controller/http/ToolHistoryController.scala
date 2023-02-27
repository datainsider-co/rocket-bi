package datainsider.toolscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.toolscheduler.domain.request.ListToolHistoryRequest
import datainsider.toolscheduler.service.ToolHistoryService

class ToolHistoryController @Inject() (toolHistoryService: ToolHistoryService) extends Controller {

  post("/tool/history/list") { request: ListToolHistoryRequest =>
    val orgId = request.currentOrganizationId.get
    toolHistoryService.list(orgId, request.keyword, request.from, request.size, request.sorts)
  }
}

package datainsider.toolscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.toolscheduler.domain.request.{CreateToolJobRequest, ForceRunRequest, ListToolJobRequest, UpdateToolJobRequest}
import datainsider.toolscheduler.service.ToolJobService

class ToolJobController @Inject() (toolJobService: ToolJobService) extends Controller {

  get("/tool/job/:id") { request: Request =>
    val orgId = request.currentOrganizationId.get
    val jobId: Long = request.getLongParam("id")
    toolJobService.get(orgId, jobId)
  }

  post("/tool/job/create") { request: CreateToolJobRequest =>
    val orgId = request.currentOrganizationId.get
    val username = request.currentUsername
    toolJobService.create(request.toToolJob(orgId, username))
  }

  post("/tool/job/list") { request: ListToolJobRequest =>
    val orgId = request.currentOrganizationId.get
    toolJobService.list(orgId, request.keyword, request.from, request.size, request.sorts)
  }

  put("/tool/job/:id") { request: UpdateToolJobRequest =>
    val orgId = request.currentOrganizationId.get
    val jobId: Long = request.request.getLongParam("id")
    toolJobService.update(orgId, jobId, request).map(success => Map("success" -> success))
  }

  delete("/tool/job/:id") { request: Request =>
    val orgId = request.currentOrganizationId.get
    val jobId: Long = request.getLongParam("id")
    toolJobService.delete(orgId, jobId).map(success => Map("success" -> success))
  }

  post("/tool/job/:id/force_run") { request: ForceRunRequest =>
    val orgId = request.getOrganizationId()
    toolJobService.forceRun(orgId, request.id, request.atTime).map(success => Map("success" -> success))
  }
}

package datainsider.lakescheduler.controller.http

import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.lakescheduler.domain.request._
import datainsider.lakescheduler.service.LakeJobService

import javax.inject.Inject

class LakeJobController @Inject() (lakeJobService: LakeJobService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.require("lake_job:view:*"))
    .post("/lake/job/list") { request: ListLakeJobRequest =>
      lakeJobService.list(request.currentOrganizationId.get, request)
    }

  filter(permissionFilter.require("lake_job:create:*"))
    .post("/lake/job/create") { request: CreateLakeJobRequest =>
      lakeJobService.create(
        request.currentOrganizationId.get,
        request.job.customCopy(creatorId = request.currentUsername)
      )
    }

  filter(permissionFilter.require("lake_job:delete:[id]"))
    .delete("/lake/job/:id") { request: DeleteLakeJobRequest =>
      lakeJobService.delete(request.currentOrganizationId.get, request.id).map(success => Map("success" -> success))
    }

  filter(permissionFilter.require("lake_job:edit:[id]"))
    .put("/lake/job/:id") { request: UpdateLakeJobRequest =>
      lakeJobService.update(request.currentOrganizationId.get, request).map(success => Map("success" -> success))
    }

  filter(permissionFilter.require("lake_job:view:[id]"))
    .get("/lake/job/:id") { request: GetLakeJobRequest =>
    lakeJobService.get(request.currentOrganizationId.get, request.id)
  }
}

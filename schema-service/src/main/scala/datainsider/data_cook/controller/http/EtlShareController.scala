package datainsider.data_cook.controller.http

import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.data_cook.domain.request.ShareRequest.{
  ListSharedUserRequest,
  RevokeShareRequest,
  ShareEtlToUsersRequest,
  UpdateShareRequest
}
import datainsider.data_cook.service.EtlShareService

import javax.inject.{Inject, Singleton}

@Singleton
class EtlShareController @Inject() (etlShareService: EtlShareService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.require("etl:view:[id]"))
    .get("/data_cook/:id/share/list") { request: ListSharedUserRequest =>
      etlShareService.listSharedUsers(request.currentOrganizationId.get, request)
    }

  filter(permissionFilter.require("etl:share:[id]"))
    .post("/data_cook/:id/share") { request: ShareEtlToUsersRequest =>
      etlShareService.share(request.currentOrganizationId.get, request)
    }

  filter(permissionFilter.require("etl:share:[id]"))
    .put("/data_cook/:id/share/update") { request: UpdateShareRequest =>
      etlShareService.update(request.currentOrganizationId.get, request)
    }

  filter(permissionFilter.require("etl:share:[id]"))
    .delete("/data_cook/:id/share/revoke") { request: RevokeShareRequest =>
      etlShareService.revoke(request.currentOrganizationId.get, request)
    }
}

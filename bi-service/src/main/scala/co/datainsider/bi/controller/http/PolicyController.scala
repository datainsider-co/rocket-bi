package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.{ListPolicyRequest, SavePolicyRequest}
import co.datainsider.bi.service.RlsPolicyService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter

class PolicyController @Inject() (policyService: RlsPolicyService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.require("rls:view:*"))
    .post("/policies/list") { request: ListPolicyRequest =>
      val orgId = request.currentOrganizationId.get
      policyService.list(orgId, request.dbName, request.tblName)
    }

  filter(permissionFilter.require("rls:edit:*"))
    .put("/policies") { request: SavePolicyRequest =>
      val orgId = request.currentOrganizationId.get
      policyService.save(orgId, request.dbName, request.tblName, request.policies.map(_.copy(orgId = orgId)))
    }

}

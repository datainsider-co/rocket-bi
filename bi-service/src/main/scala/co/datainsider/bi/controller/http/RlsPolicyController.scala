package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.{ListPolicyRequest, PutPolicyRequest}
import co.datainsider.bi.service.RlsPolicyService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.tracker.{ActionType, ResourceType, UserActivityTracker}

import scala.concurrent.ExecutionContext.Implicits.global

class RlsPolicyController @Inject() (policyService: RlsPolicyService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.require("rls:view:*"))
    .post("/policies/list") { request: ListPolicyRequest =>
      val orgId = request.currentOrganizationId.get
      policyService.list(orgId, request.dbName, request.tblName)
    }

  filter(permissionFilter.require("rls:edit:*"))
    .put("/policies") { request: PutPolicyRequest =>
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.RlsPolicy,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"update rls policy"
      ) {
        val orgId = request.currentOrganizationId.get
        policyService.put(orgId, request.dbName, request.tblName, request.policies.map(_.copy(orgId = orgId)))
      }
    }

}

package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.{ListPolicyRequest, PutPolicyRequest}
import co.datainsider.bi.service.RlsPolicyService
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission

class RlsPolicyController @Inject() (policyService: RlsPolicyService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.requireAll("rls:view:*", LicensePermission.ViewData))
    .post("/policies/list") { request: ListPolicyRequest =>
      Profiler(s"/policies/list") {
        val orgId = request.currentOrganizationId.get
        policyService.list(orgId, request.dbName, request.tblName)
      }
    }

  filter(permissionFilter.requireAll("rls:edit:*", LicensePermission.EditData))
    .put("/policies") { request: PutPolicyRequest =>
      Profiler(s"/policies PUT") {
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

}

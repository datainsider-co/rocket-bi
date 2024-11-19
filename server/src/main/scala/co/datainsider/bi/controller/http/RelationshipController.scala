package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.UpdateRelationshipRequest
import co.datainsider.bi.service.RelationshipService
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission

class RelationshipController @Inject() (relationshipService: RelationshipService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.requireAll("relationship:view:global", LicensePermission.ViewData))
    .get(s"/relationships/global") { request: Request =>
      Profiler(s"/relationships/global GET") {
        val orgId = request.currentOrganizationId.get
        relationshipService.getGlobal(orgId)
      }
    }

  filter(permissionFilter.requireAll("relationship:create:global", LicensePermission.EditData))
    .post(s"/relationships/global") { request: UpdateRelationshipRequest =>
      Profiler(s"/relationships/global POST") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.Relationship,
          resourceId = null,
          description = s"update global table relationships"
        ) {
          val orgId: Long = request.currentOrganizationId.get
          relationshipService
            .createOrUpdateGlobal(orgId, request.toRelationshipInfo)
            .map(toResponse)
        }
      }
    }

  filter(permissionFilter.requireAll("relationship:delete:global", LicensePermission.EditData))
    .delete(s"/relationships/global") { request: Request =>
      Profiler(s"/relationships/global DELETE") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Delete,
          resourceType = ResourceType.Relationship,
          resourceId = null,
          description = s"delete table relationships"
        ) {
          val orgId: Long = request.currentOrganizationId.get
          relationshipService.deleteGlobal(orgId).map(toResponse)
        }
      }
    }

  filter(permissionFilter.requireAll("relationship:view:[dashboard_id]", LicensePermission.ViewData))
    .get(s"/relationships/:dashboard_id") { request: Request =>
      Profiler(s"/relationships/:dashboard_id GET") {
        val orgId = request.currentOrganizationId.get
        val dashboardId: Long = request.getLongParam("dashboard_id")
        relationshipService.get(orgId, dashboardId)
      }
    }

  filter(permissionFilter.requireAll("relationship:create:[dashboard_id]", LicensePermission.EditData))
    .post(s"/relationships/:dashboard_id") { request: UpdateRelationshipRequest =>
      Profiler(s"/relationships/:dashboard_id POST") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.Relationship,
          resourceId = request.request.getLongParam("dashboard_id").toString,
          description = s"update dashboard table relationships"
        ) {
          val orgId = request.currentOrganizationId.get
          val dashboardId: Long = request.request.getLongParam("dashboard_id")
          relationshipService
            .createOrUpdate(orgId, dashboardId, request.toRelationshipInfo)
            .map(toResponse)
        }
      }
    }

  filter(permissionFilter.requireAll("relationship:delete:[dashboard_id]", LicensePermission.EditData))
    .delete(s"/relationships/:dashboard_id") { request: Request =>
      Profiler(s"/relationships/:dashboard_id DELETE") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Delete,
          resourceType = ResourceType.Relationship,
          resourceId = request.request.getLongParam("dashboard_id").toString,
          description = s"delete dashboard table relationships"
        ) {
          val orgId = request.currentOrganizationId.get
          val dashboardId: Long = request.getLongParam("dashboard_id")
          relationshipService.delete(orgId, dashboardId).map(toResponse)
        }
      }
    }

  private def toResponse(success: Boolean): Map[String, Any] = {
    Map("success" -> success)
  }

}

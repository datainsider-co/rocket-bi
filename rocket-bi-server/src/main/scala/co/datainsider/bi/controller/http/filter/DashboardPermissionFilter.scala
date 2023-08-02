package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import co.datainsider.caas.user_profile.client.CaasClientService
import co.datainsider.share.service.PermissionTokenService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import datainsider.client.util.Implicits.ImplicitRequestLike

import javax.inject.{Inject, Named}

/**
  * created 2022-11-26 5:55 PM
  *
  * @author tvc12 - Thien Vi
  */
class DashboardPermissionFilter @Inject() (
    caasClientService: CaasClientService,
    dashboardService: DashboardService,
    @Named("token_header_key") tokenKey: String,
    permissionTokenService: PermissionTokenService
) extends Logging {
  def requireDirectoryOwner(dashboardParamName: String): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        val dashboardId: DashboardId = request.getQueryOrBodyParam(dashboardParamName).toLong
        dashboardService
          .get(request.getOrganizationId(), dashboardId)
          .map(dashboard => {
            if (request.currentUsername.equals(dashboard.ownerId)) {
              Permitted()
            } else {
              UnPermitted("You are not the owner of this dashboard")
            }
          })
      }
    }
  }

  def requireUserPermission(action: String, dashboardParamName: String): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        val orgId: Long = request.getOrganizationId()
        val dashboardId: DashboardId = request.getQueryOrBodyParam(dashboardParamName).toLong
        for {
          permission <- buildPermission(orgId, dashboardId, action)
          isPermitted <- caasClientService.isOrgPermittedAll(
            request.getOrganizationId(),
            request.currentUsername,
            Array(permission)
          )
        } yield {
          if (isPermitted) {
            Permitted()
          } else {
            logger.warn(s"User ${request.currentUsername} not authorized for $permission")
            UnPermitted(s"You do not have permissions to perform this action!")
          }
        }
      }
    }
  }

  def requireTokenPermission(action: String, dashboardParamName: String): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        val orgId: Long = request.getOrganizationId()
        val dashboardId: DashboardId = request.getQueryOrBodyParam(dashboardParamName).toLong
        val token: String = request.headerMap.getOrNull(tokenKey)
        if (token == null) {
          Future.value(UnPermitted("Token is required"))
        } else {
          for {
            permission <- buildPermission(orgId, dashboardId, action)
            isPermitted <- permissionTokenService.isPermitted(token, permission)
          } yield {
            if (isPermitted) {
              Permitted()
            } else {
              logger.warn(s"Token $token not authorized for $permission")
              UnPermitted(s"You do not have permissions to perform this action!")
            }
          }
        }
      }
    }
  }

  /**
    * build permission check permission for dashboard
    */
  private def buildPermission(orgId: Long, dashboardId: DashboardId, action: String): Future[String] = {
    for {
      directoryId <- dashboardService.getDirectoryId(orgId, dashboardId)
      permission: String = PermissionProviders.permissionBuilder.perm(
        organizationId = orgId,
        domain = DirectoryType.Directory.toString,
        action = action,
        directoryId.toString
      )
    } yield permission
  }
}

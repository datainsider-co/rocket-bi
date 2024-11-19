package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.service.{DeletedDirectoryService, DirectoryService}
import co.datainsider.caas.user_profile.client.CaasClientService
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.share.service.PermissionTokenService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.common.authorization.domain.PermissionProviders
import co.datainsider.common.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.common.client.util.Implicits.ImplicitRequestLike

import javax.inject.{Inject, Named}

/**
  * created 2022-11-26 5:55 PM
  *
  * @author tvc12 - Thien Vi
  */
class DirectoryPermissionFilter @Inject() (
    caasClientService: CaasClientService,
    directoryService: DirectoryService,
    deletedDirectoryService: DeletedDirectoryService,
    @Named("token_header_key") tokenKey: String,
    permissionTokenService: PermissionTokenService
) extends Logging {
  def requireDirectoryOwner(directoryParamName: String, isDeleted: Boolean = false): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {

        val directoryId: DirectoryId = request.getQueryOrBodyParam(directoryParamName).toLong
        (directoryId) match {
          case MyData | Shared => Future.value(Permitted())
          case _ => {
            if (isDeleted) {
              isOwnerDeletedDirectory(request.getOrganizationId(), directoryId, request.currentUsername)
            } else {
              isOwnerDirectory(request.getOrganizationId(), directoryId, request.currentUsername)
            }
          }
        }
      }
    }
  }

  def requireUserPermission(action: String, directoryParamName: String): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        val orgId: Long = request.getOrganizationId()
        val directoryId: DirectoryId = request.getQueryOrBodyParam(directoryParamName).toLong
        for {
          permission <- buildPermission(orgId, directoryId, action)
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

  def requireTokenPermission(action: String, directoryParamName: String): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        val orgId: Long = request.getOrganizationId()
        val directoryId: DirectoryId = request.getQueryOrBodyParam(directoryParamName).toLong
        val token: String = request.headerMap.getOrNull(tokenKey)
        if (token == null) {
          Future.value(UnPermitted("Token is required"))
        } else {
          for {
            permission <- buildPermission(orgId, directoryId, action)
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
    * build permission check permission for directory
    */
  private def buildPermission(orgId: Long, directoryId: DirectoryId, action: String): Future[String] =
    Future {
      PermissionProviders.permissionBuilder.perm(
        organizationId = orgId,
        domain = DirectoryType.Directory.toString,
        action = action,
        directoryId.toString
      )
    }

  private def isOwnerDirectory(orgId: Long, directoryId: DirectoryId, username: String): Future[PermissionResult] = {
    directoryService.isOwner(orgId, directoryId, username).map {
      case true  => Permitted()
      case false => UnPermitted(s"You do not have permissions to perform this action!")
    }
  }

  private def isOwnerDeletedDirectory(
      orgId: Long,
      directoryId: DirectoryId,
      username: String
  ): Future[PermissionResult] = {
    deletedDirectoryService.isOwner(orgId, directoryId, username).map {
      case true  => Permitted()
      case false => UnPermitted(s"You do not have permissions to perform this action!")
    }
  }
}

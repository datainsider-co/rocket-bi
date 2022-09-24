package datainsider.admin.service

import com.twitter.util.Future
import datainsider.apikey.service.ApiKeyService
import datainsider.client.domain.{ApiKeyInfo, ApiKeyResponse, Page}
import datainsider.client.domain.user.LoginResponse
import datainsider.client.service.CaasClientService
import datainsider.user_caas.service.{Caas, CaasService, UserService}
import datainsider.user_profile.service.AuthService

import javax.inject.Inject

/**
  * Lop mapping caas service to caas client service, su dung cho PermissionFilter
  */
class MappingCaasClientService @Inject() (
    authService: AuthService,
    caasService: CaasService,
    userService: UserService,
    apiKeyService: ApiKeyService
) extends CaasClientService {
  override def checkSession(sessionId: String): Future[LoginResponse] = authService.checkSession(sessionId)

  override def getRoles(sessionId: String): Future[Seq[String]] = caasService.getRoles(sessionId)

  override def hasRole(sessionId: String, role: String): Future[Boolean] = caasService.hasRole(sessionId, role)

  override def hasRoles(sessionId: String, roles: Seq[String]): Future[Map[String, Boolean]] =
    caasService.hasRoles(sessionId, roles)

  override def hasAllRoles(sessionId: String, roles: Seq[String]): Future[Boolean] =
    caasService.hasAllRoles(sessionId, roles)

  override def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean] =
    caasService.isPermittedAll(sessionId, permissions)

  override def isOrgPermittedAll(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] =
    caasService.orgAuthorization().isPermittedAll(organizationId, username, permissions: _*)

  override def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]] =
    caasService.isPermitted(sessionId, permissions)

  override def isOrgPermitted(
      organizationId: Long,
      username: String,
      permissions: Seq[String]
  ): Future[Map[String, Boolean]] =
    caasService.orgAuthorization().isPermitted(organizationId, username, permissions: _*)

  override def getActiveUsername(organizationId: Long, from: Int, size: Int): Future[Page[String]] = {
    userService.listActiveUserIds(organizationId, from, size).map(page => Page[String](page.total, page.data))
  }

  override def hasOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Map[String, Boolean]] =
    caasService.orgAuthorization().hasRoles(organizationId, username, roles)

  override def hasAllOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Boolean] =
    caasService.orgAuthorization().hasAllRoles(organizationId, username, roles)

  override def getApiKey(apiKey: String): Future[Option[ApiKeyResponse]] = {
    apiKeyService
      .get(apiKey)
      .map(resp => {
        val apiKeyInfo = ApiKeyInfo(
          organizationId = resp.apiKeyInfo.organizationId,
          apiKey = resp.apiKeyInfo.apiKey,
          displayName = resp.apiKeyInfo.displayName,
          expiredTimeMs = resp.apiKeyInfo.expiredTimeMs,
          createdAt = resp.apiKeyInfo.createdAt
        )
        Some(ApiKeyResponse(apiKeyInfo, resp.permissions))
      })
      .rescue {
        case e: Throwable => Future.None
      }
  }
}

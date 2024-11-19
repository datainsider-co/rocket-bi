package co.datainsider.caas.user_profile.client

import co.datainsider.caas.apikey.domain.ApiKeyInfo
import co.datainsider.caas.apikey.domain.response.ApiKeyResponse
import co.datainsider.caas.apikey.service.ApiKeyService
import co.datainsider.caas.user_caas.domain.Page
import co.datainsider.caas.user_caas.service.CaasService
import co.datainsider.caas.user_profile.domain.user.LoginResponse
import co.datainsider.caas.user_profile.service.AuthService
import co.datainsider.common.client.util.JsonParser
import com.twitter.util.Future

import javax.inject.Inject

trait CaasClientService {

  def checkSession(sessionId: String): Future[LoginResponse]

  def getRoles(sessionId: String): Future[Seq[String]]

  def hasRole(sessionId: String, role: String): Future[Boolean]

  def hasRoles(sessionId: String, roles: Seq[String]): Future[Map[String, Boolean]]

  def hasAllRoles(sessionId: String, roles: Seq[String]): Future[Boolean]

  def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean]

  def isOrgPermittedAll(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]]

  def isOrgPermitted(organizationId: Long, username: String, permissions: Seq[String]): Future[Map[String, Boolean]]

  def getActiveUsername(organizationId: Long, from: Int, size: Int): Future[Page[String]]

  def hasOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Map[String, Boolean]]

  def hasAllOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Boolean]

  def getApiKey(apiKey: String): Future[ApiKeyResponse]

}

class CaasClientServiceImpl @Inject() (
    authService: AuthService,
    caasService: CaasService,
    apiKeyService: ApiKeyService
) extends CaasClientService {

  override def checkSession(sessionId: String): Future[LoginResponse] = {
    authService.checkSession(sessionId)
  }

  override def getRoles(sessionId: String): Future[Seq[String]] = {
    caasService.getRoles(sessionId)
  }

  override def hasRole(sessionId: String, role: String): Future[Boolean] = {
    caasService.hasRole(sessionId, role)
  }

  override def hasRoles(sessionId: String, roles: Seq[String]): Future[Map[String, Boolean]] = {
    caasService.hasRoles(sessionId, roles)
  }

  override def hasAllRoles(sessionId: String, roles: Seq[String]): Future[Boolean] = {
    caasService.hasAllRoles(sessionId, roles)
  }

  override def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean] = {
    caasService.isPermittedAll(sessionId, permissions)
  }

  override def isOrgPermittedAll(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    caasService.orgAuthorization().isPermittedAll(organizationId, username, permissions: _*)
  }

  override def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]] = {
    caasService.isPermitted(sessionId, permissions)
  }

  override def isOrgPermitted(
      organizationId: Long,
      username: String,
      permissions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    caasService.orgAuthorization().isPermitted(organizationId, username, permissions: _*)
  }

  override def getActiveUsername(organizationId: Long, from: Int, size: Int): Future[Page[String]] = ???

  override def hasOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Map[String, Boolean]] = {
    caasService.orgAuthorization().hasRoles(organizationId, username, roles)
  }

  override def hasAllOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Boolean] = {
    caasService.orgAuthorization().hasAllRoles(organizationId, username, roles)
  }

  override def getApiKey(apiKey: String): Future[ApiKeyResponse] = {
    apiKeyService.get(apiKey)
  }
}

case class MockCaasClientServiceImpl() extends CaasClientService {

  override def checkSession(sessionId: String): Future[LoginResponse] = {
    Future {
      JsonParser.fromJson[LoginResponse]("""{
                                           |  "session": {
                                           |    "key": "ssid",
                                           |    "value": "05c91ec8-719e-41c0-9b52-1846a8eeb921",
                                           |    "domain": ".datainsider.co",
                                           |    "timeout_in_ms": 31104000000,
                                           |    "path": "/",
                                           |    "max_age": 1629303213482
                                           |  },
                                           |  "user_info": {
                                           |    "username": "test@gmail.com",
                                           |    "organization": {
                                           |      "organization_id": 1,
                                           |      "owner": "test@gmail.com",
                                           |      "name": "Data Insider",
                                           |      "created_time": 0,
                                           |      "licence_key": "1234567890"
                                           |    },
                                           |    "roles": [],
                                           |    "is_active": true,
                                           |    "created_time": 1598195240844
                                           |  },
                                           |  "user_profile": {
                                           |    "username": "test@gmail.com",
                                           |    "already_confirmed": true,
                                           |    "full_name": "Andy",
                                           |    "email": "test@gmail.com",
                                           |    "updated_time": 1598195240246,
                                           |    "created_time": 1598195240246
                                           |  },
                                           |  "default_oauth_credential": false
                                           |}""".stripMargin)
    }
  }

  override def getRoles(sessionId: String): Future[Seq[String]] = {
    Future.value(Seq("admin"))
  }

  override def hasRole(sessionId: String, roleName: String): Future[Boolean] = {
    Future.True
  }

  override def hasRoles(sessionId: String, roles: Seq[String]): Future[Map[String, Boolean]] = {
    Future.value(roles.map(roleName => roleName -> true).toMap)

  }

  override def hasAllRoles(sessionId: String, roles: Seq[String]): Future[Boolean] = {
    Future.True

  }

  override def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean] = {
    Future.True
  }

  override def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]] = {
    Future.value(permissions.map(permission => permission -> true).toMap)
  }

  override def getActiveUsername(organizationId: Long, from: Int, size: Int): Future[Page[String]] = {
    Future.value(Page(0, Seq.empty))
  }

  override def isOrgPermittedAll(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] =
    Future.True

  override def isOrgPermitted(
      organizationId: Long,
      username: String,
      permissions: Seq[String]
  ): Future[Map[String, Boolean]] =
    Future.value(
      permissions.map(permission => permission -> true).toMap
    )

  override def hasOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Map[String, Boolean]] =
    Future.value(
      roles.map(role => role -> true).toMap
    )

  override def hasAllOrgRoles(organizationId: Long, username: String, roles: Seq[String]): Future[Boolean] = Future.True

  override def getApiKey(apiKey: String): Future[ApiKeyResponse] =
    Future {
      ApiKeyResponse(
        apiKeyInfo =
          ApiKeyInfo(0, "mock_api_key", "MockApiKey", System.currentTimeMillis() + 10000, 0L, 0L, None, None),
        permissions = Set()
      )
    }

}

package co.datainsider.caas.apikey.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.apikey.domain.ApiKeyInfo
import co.datainsider.caas.apikey.domain.request._
import co.datainsider.caas.apikey.domain.response.{ApiKeyResponse, ListApiKeyResponse}
import co.datainsider.caas.apikey.repository.ApiKeyRepository
import co.datainsider.caas.user_caas.domain.UserType
import co.datainsider.caas.user_caas.service.{OrgAuthorizationService, UserService}
import co.datainsider.caas.user_profile.domain.user.{LoginResponse, User, UserProfile}
import co.datainsider.caas.user_profile.service.UserProfileService
import com.twitter.finatra.http.exceptions.NotFoundException
import com.twitter.inject.Logging
import com.twitter.util.Future

import java.util.UUID
import javax.inject.Inject

trait ApiKeyService {

  /**
    * Auto generate api key
    * Assign permissions for api key
    * Store api key info
    *
    * @return api key info
    */
  def create(request: CreateApiKeyRequest): Future[ApiKeyResponse]

  /**
    * Get api key info
    *
    * @return api key info
    */
  def getApiKey(request: GetApiKeyRequest): Future[ApiKeyResponse]

  /**
    * Get api key info
    *
    * @return api key info
    */
  def get(apiKey: String): Future[ApiKeyResponse]

  /**
    * list api key info
    */
  def listApiKeys(request: ListApiKeyRequest): Future[ListApiKeyResponse]

  /**
    * update api key info
    *
    * @return updated api key info
    */
  def updateApiKey(request: UpdateApiKeyRequest): Future[Boolean]

  /**
    * delete api key
    *
    * @return true if success, false if fail
    */
  def deleteApiKey(organizationId: Long, apiKey: String): Future[Boolean]

  /**
    * login by api key
    *
    * @return Api key and user profile as login response
    */
  def loginByApiKey(apiKey: String): Future[Option[LoginResponse]]
}

class ApikeyServiceImpl @Inject() (
    apiKeyRepository: ApiKeyRepository,
    userProfileService: UserProfileService,
    userService: UserService,
    orgAuthorizationService: OrgAuthorizationService
) extends ApiKeyService
    with Logging {

  val defaultExpiredTime: Long = ZConfig.getLong("api_key.timeout_in_ms", 5184000000L)
  val apiKeyPrefix: String = ZConfig.getString("api_key.prefix", default = "di_api")
  val mailDomain: String = ZConfig.getString("api_key.mail_domain", default = "datainsider.co")
  // For build login response
  val sessionKey: String = ZConfig.getString("session.name")
  val sessionDomain: String = ZConfig.getString("session.domain")

  override def create(request: CreateApiKeyRequest): Future[ApiKeyResponse] = {
    val apiKey: String = request.apiKey.getOrElse(s"${apiKeyPrefix}_${UUID.randomUUID().toString}")
    val orgId: Long = request.currentOrganizationId.get
    val apiKeyInfo = ApiKeyInfo(
      organizationId = orgId,
      apiKey = apiKey,
      displayName = request.displayName,
      expiredTimeMs = request.expiredTimeMs.getOrElse(defaultExpiredTime),
      createdAt = System.currentTimeMillis(),
      updatedAt = System.currentTimeMillis(),
      createdBy = Option(request.currentUsername),
      updatedBy = Option(request.currentUsername)
    )
    for {
      apiKeyUser <- userService.createUser(orgId, apiKey, password = s"di@$apiKey", userType = Some(UserType.ApiKey))
      userprofile = buildUserProfile(apiKeyUser, request.displayName)
      _ <- userProfileService.createProfile(orgId, userprofile)
      _ <- apiKeyRepository.insert(apiKeyInfo)
      _ <- orgAuthorizationService.addPermissions(orgId, apiKeyUser.username, request.getPermissions)
    } yield ApiKeyResponse(apiKeyInfo, apiKeyUser.permissions)
  }

  private def buildUserProfile(apiKeyUser: User, displayName: String): UserProfile = {
    val userprofile = UserProfile(
      username = apiKeyUser.username,
      fullName = Some(displayName),
      email = Some(s"${apiKeyUser.username}@${mailDomain}"),
      alreadyConfirmed = true,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = Some(System.currentTimeMillis())
    )
    userprofile
  }

  override def getApiKey(request: GetApiKeyRequest): Future[ApiKeyResponse] = {
    for {
      apiKeyInfo <- apiKeyRepository.get(request.apiKey)
      apiKeyUser <- userService.getUserInfo(request.currentOrganizationId.get, request.apiKey)
    } yield apiKeyInfo match {
      case Some(value) => ApiKeyResponse(value, apiKeyUser.permissions)
      case None        => throw new NotFoundException("not found api key")
    }
  }

  override def get(apiKey: String): Future[ApiKeyResponse] = {
    for {
      apiKeyInfo <- fetch(apiKey)
      apiKeyAsUser <- userService.getUserInfo(apiKeyInfo.organizationId, apiKey)
    } yield ApiKeyResponse(apiKeyInfo, apiKeyAsUser.permissions)
  }

  override def listApiKeys(request: ListApiKeyRequest): Future[ListApiKeyResponse] = {
    for {
      data <- apiKeyRepository.list(
        request.currentOrganizationId.get,
        request.keyword.getOrElse(""),
        request.from,
        request.size,
        request.sorts
      )
      total <- apiKeyRepository.count(request.currentOrganizationId.get, request.keyword.getOrElse(""))
    } yield ListApiKeyResponse(data, total)
  }

  override def updateApiKey(request: UpdateApiKeyRequest): Future[Boolean] = {
    for {
      currentApiKeyInfo <- fetch(request.apiKey)
      isUpdatedPermissionSuccess <- orgAuthorizationService.changePermissions(
        organizationId = request.getOrganizationId(),
        username = request.apiKey,
        includePermissions = request.getIncludesPermissions,
        excludePermissions = request.getExcludePermissions,
        isApiKey = true
      )
      isUpdateInfoSuccess <- apiKeyRepository.update(
        organizationId = request.getOrganizationId(),
        apiKey = request.apiKey,
        displayName = request.displayName,
        expiredTimeMs = request.expiredTimeMs.getOrElse(currentApiKeyInfo.expiredTimeMs),
        updatedBy = request.currentUsername,
        updatedAt = System.currentTimeMillis()
      )
    } yield isUpdatedPermissionSuccess && isUpdateInfoSuccess
  }

  override def deleteApiKey(organizationId: Long, apiKey: String): Future[Boolean] = {
    for {
      _ <- userService.deleteUser(organizationId, apiKey)
      isOk <- apiKeyRepository.delete(organizationId, apiKey)
    } yield isOk
  }

  override def loginByApiKey(apiKey: String): Future[Option[LoginResponse]] = {
    apiKeyRepository
      .get(apiKey)
      .map {
        case Some(apiKeyInfo) => buildLoginResponse(apiKeyInfo)
        case None             => Future.None
      }
      .flatten
  }

  private def buildLoginResponse(apiKeyInfo: ApiKeyInfo): Future[Option[LoginResponse]] = {
    for {
      user <- userService.getUserInfo(apiKeyInfo.organizationId, apiKeyInfo.apiKey)
      profile <- userProfileService.getUserProfile(apiKeyInfo.organizationId, apiKeyInfo.apiKey)
    } yield Some(
      LoginResponse(
        session = apiKeyInfo.toSessionInfo(sessionKey, sessionDomain),
        userInfo = user.toUserInfo(),
        userProfile = profile
      )
    )
  }

  private def fetch(apiKey: String): Future[ApiKeyInfo] = {
    apiKeyRepository.get(apiKey).map {
      case Some(apiKeyInfo) => apiKeyInfo
      case None             => throw new NotFoundException(s"not found api key: $apiKey")
    }
  }

}

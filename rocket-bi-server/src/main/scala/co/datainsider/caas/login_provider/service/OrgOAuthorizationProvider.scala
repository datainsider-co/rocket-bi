package co.datainsider.caas.login_provider.service

import com.twitter.util.Future
import co.datainsider.caas.login_provider.domain.{OAuthConfig, OAuthInfo}
import co.datainsider.caas.login_provider.repository.{OAuthConfigRepository, OAuthProvider, OAuthProviderFactory}
import com.google.common.cache.{Cache, CacheBuilder, CacheLoader}

import java.util.UUID
import javax.inject.Inject

/**
  * @author tvc12
  */
trait OrgOAuthorizationProvider {
  def isWhitelistEmail(organizationId: Long, oauthType: String, email: String): Future[Boolean]

  def getOAuthConfigAsMap(organizationId: Long): Future[Map[String, OAuthConfig]]

  def getOAuthInfo(organizationId: Long, oauthType: String, id: String, token: String): Future[OAuthInfo]

  def generatePassword(): String

  def generatePassword(id: String): String

  def multiUpdateOauthConfig(newConfigAsMap: Map[String, OAuthConfig]): Future[Boolean]

  def deleteOauthConfig(organizationId: Long, oauthType: String): Future[Boolean]

  def isActive(organizationId: Long, oauthType: String): Future[Boolean]
}

class OrgOAuthorizationProviderImpl @Inject() (oauthConfigRepository: OAuthConfigRepository)
    extends OrgOAuthorizationProvider {
  private val oAuthServiceCache = CacheBuilder
    .newBuilder()
    .maximumSize(100)
    .build[String, OAuthService](new CacheLoader[String, OAuthService] {
      override def load(key: String): OAuthService = createAndAddOAuthService(key.toLong)
    })

  def createAndAddOAuthService(organizationId: Long): OAuthService = {
    val oauthConfigAsMap = oauthConfigRepository.getAllOAuthConfig(organizationId)
    OAuthServiceV2(createOAuthProviders(oauthConfigAsMap))
  }

  private def createOAuthProviders(oauthConfigAsMap: Map[String, OAuthConfig]): Map[String, OAuthProvider] = {
    oauthConfigAsMap.map {
      case (oauthType, newConfig) => oauthType -> OAuthProviderFactory.create(oauthType, newConfig)
    }
  }

  private def getOAuthService(organizationId: Long): Future[OAuthService] = {
    Future.value(oAuthServiceCache.get(organizationId.toString))
  }

  override def getOAuthConfigAsMap(organizationId: Long): Future[Map[String, OAuthConfig]] = {
    for {
      oAuthService <- getOAuthService(organizationId)
      oAuthConfigAsMap <- oAuthService.getOAuthConfigAsMap()
    } yield oAuthConfigAsMap
  }

  override def getOAuthInfo(organizationId: Long, oauthType: String, id: String, token: String): Future[OAuthInfo] = {
    for {
      oAuthService <- getOAuthService(organizationId)
      oAuthInfo <- oAuthService.getOAuthInfo(oauthType, id, token)
    } yield oAuthInfo
  }

  override def generatePassword(): String = {
    OAuthProvider.generatePassword(UUID.randomUUID().toString)
  }

  override def generatePassword(id: String): String = {
    OAuthProvider.generatePassword(id)
  }

  def updateOAuthConfig(organizationId: Long, newOAuthConfigAsMap: Map[String, OAuthConfig]): Future[Boolean] = {
    oauthConfigRepository.multiInsertOrUpdateIfExisted(newOAuthConfigAsMap)
    oAuthServiceCache.invalidate(organizationId.toString)
    Future.True
  }

  override def multiUpdateOauthConfig(newConfigAsMap: Map[String, OAuthConfig]): Future[Boolean] = {
    val fn = newConfigAsMap
      .groupBy((oauthTypeConfig) => oauthTypeConfig._2.organizationId)
      .map {
        case (organizationId, oAuthConfigAsMap: Map[String, OAuthConfig]) =>
          updateOAuthConfig(organizationId, oAuthConfigAsMap)
      }
      .toSeq
    Future.collect(fn).map(_.forall(success => success))
  }

  override def isWhitelistEmail(organizationId: Long, oauthType: String, email: String): Future[Boolean] = {
    for {
      oAuthService <- getOAuthService(organizationId)
      isWhitelistEmail <- oAuthService.isWhitelistEmail(oauthType, email)
    } yield isWhitelistEmail
  }

  override def deleteOauthConfig(organizationId: Long, oauthType: String): Future[Boolean] = {
    oauthConfigRepository.deleteOathConfig(organizationId, oauthType)
    oAuthServiceCache.invalidate(organizationId.toString)
    Future.True
  }


  override def isActive(organizationId: Long, oauthType: String): Future[Boolean] = {
    for {
      oAuthService <- getOAuthService(organizationId)
      isActive = oAuthService.isActive(oauthType)
    } yield isActive
  }
}

package datainsider.login_provider.service

import com.twitter.util.Future
import datainsider.login_provider.domain._
import datainsider.login_provider.repository._

import scala.collection.mutable

/**
  * @author andy
  * @since 8/10/20
  * */
trait OAuthService {

  def isWhitelistEmail(oauthType: String, email: String): Future[Boolean]

  def getOAuthInfo(oauthType: String, id: String, token: String): Future[OAuthInfo]

  def getOAuthConfigAsMap(): Future[Map[String, OAuthConfig]]

  def isActive(oauthType: String): Boolean
}

@deprecated("use OAuthServiceProviderV2 ")
case class OAuthServiceImpl(whitelistEmailPatternMap: Map[String, String], oauthProviders: Map[String, OAuthProvider])
    extends OAuthService {

  override def isWhitelistEmail(oauthType: String, email: String): Future[Boolean] = {
    Future {
      isEmailValid(email, whitelistEmailPatternMap.getOrElse(oauthType, ""))
    }
  }

  private def isEmailValid(email: String, emailRegexPattern: String): Boolean = {
    if (emailRegexPattern != null && emailRegexPattern.nonEmpty) {
      val regexp = emailRegexPattern.r
      regexp.findFirstMatchIn(email) match {
        case Some(_) => true
        case None    => false
      }
    } else {
      true
    }
  }

  override def getOAuthInfo(oauthType: String, id: String, token: String): Future[OAuthInfo] =
    Future {
      val repository = getRepository(oauthType)
      repository.getOAuthInfo(id, token)
    }

  private def getRepository(oauthType: String): OAuthProvider = {
    oauthProviders.get(oauthType) match {
      case Some(repository) => repository
      case None             => throw new UnsupportedOperationException("oauthType invalid")
    }
  }

  override def getOAuthConfigAsMap(): Future[Map[String, OAuthConfig]] = {
    Future.exception(new NotImplementedError())
  }

  override def isActive(oauthType: String): Boolean = false
}

case class OAuthServiceV2(oauthProviders: Map[String, OAuthProvider]) extends OAuthService {
  override def getOAuthConfigAsMap(): Future[Map[String, OAuthConfig]] =
    Future {
      oauthProviders.map {
        case (oauthType, provider) => oauthType -> provider.getOAuthConfig()
      }
    }

  override def isWhitelistEmail(oauthType: String, email: String): Future[Boolean] = {
    getOAuthProvider(oauthType).isWhitelistEmail(oauthType, email)
  }

  override def getOAuthInfo(oauthType: String, id: String, token: String): Future[OAuthInfo] =
    Future {
      getOAuthProvider(oauthType).getOAuthInfo(id, token)
    }

  private def getOAuthProvider(oauthType: String): OAuthProvider = {
    oauthProviders.get(oauthType) match {
      case Some(oauthProvider) => oauthProvider
      case _                            => throw new UnsupportedOperationException("oauthType invalid")
    }
  }

  override def isActive(oauthType: String): Boolean = {
    getOAuthProvider(oauthType).isActive()
  }
}

case class MockOauthService() extends OAuthService {
  private val fakeOauthConfig = mutable.HashMap[String, OAuthConfig](
    OAuthType.GOOGLE -> GoogleOAuthConfig(true, Seq("gmail.com"), Set.empty),
    OAuthType.FACEBOOK -> FbOAuthConfig(true, Seq("gmail.com"), "token-123")
  )

  override def isWhitelistEmail(oauthType: String, email: String): Future[Boolean] = {
    Future.True
  }

  override def getOAuthInfo(oauthType: String, id: String, token: String): Future[OAuthInfo] = {
    Future.value(
      GoogleOAuthInfo("tvc12", "123", "gg-123", "123", "Thien", None, None, "Meomeocf98@gmail.com", "", None)
    )
  }

  override def getOAuthConfigAsMap(): Future[Map[String, OAuthConfig]] = {
    Future.value(fakeOauthConfig.toMap)
  }

  override def isActive(oauthType: String): Boolean = true
}

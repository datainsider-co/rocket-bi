package datainsider.login_provider.repository

import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.util.ZConfig
import datainsider.login_provider.domain._
import datainsider.user_profile.domain.Implicits.OptionString
import datainsider.user_profile.util.Utils
import org.apache.commons.codec.digest.HmacUtils
import scalaj.http.{Http, HttpResponse}

import java.net.SocketTimeoutException
import scala.util.parsing.json.JSON

abstract class OAuthProvider {
  def isWhitelistEmail(oauthType: String, email: String): Future[Boolean]

  def getOAuthInfo(id: String, token: String): OAuthInfo

  def getOAuthConfig(): OAuthConfig

  def isActive(): Boolean
}


object OAuthProvider {
  val PassSecretKey = ZConfig.getString("oauth.pass_secret")

  def generatePassword(id: String) = HmacUtils.hmacSha1Hex(id + OAuthProvider.PassSecretKey, OAuthProvider.PassSecretKey)

  def parseName(name: Option[String],
                givenName: Option[String],
                familyName: Option[String]
               ): (Option[String], Option[String], Option[String]) = {

    var newName = name.notEmptyOrNull
    var newFamilyName = familyName.notEmptyOrNull
    var newGivenName = givenName.notEmptyOrNull

    if (familyName.isDefined || givenName.isDefined) {
      newName = Option(s"${givenName.getOrElse("")} ${familyName.getOrElse("")}").notEmptyOrNull
    } else {
      newName.foreach(name => {
        val nameParts = name.split("\\s+")
        newGivenName = Option(nameParts.slice(0, nameParts.length).mkString(" ")).notEmptyOrNull
        newFamilyName = nameParts.lastOption.notEmptyOrNull
      })
    }
    (newName, newGivenName, newFamilyName)
  }
}


case class GoogleOAuthProvider(googleOauthConfig: GoogleOAuthConfig) extends OAuthProvider {

  def getOAuthInfo(googleId: String, token: String): OAuthInfo = {
    if (isActive()) {
      val response = getGoogleOAuthData(token)
      val idRaw = response.get("sub") match {
        case Some(s) => s
        case _ => throw new IllegalArgumentException("Illegal token!")
      }

      val (name, givenName, familyName) = OAuthProvider.parseName(
        response.get("name"),
        response.get("given_name"),
        response.get("family_name")
      )
      GoogleOAuthInfo(
        username = s"${OAuthType.GOOGLE}-$idRaw",
        id = idRaw,
        token = token,
        password = "",
        name = name.getOrElse(""),
        familyName = familyName,
        givenName = givenName,
        email = response.getOrElse("email", ""),
        avatarUrl = response.getOrElse("picture", "")
      )
    } else {
      throw UnsupportedError(s"Login with ${googleOauthConfig.name} unsupported")
    }

  }

  private def getGoogleOAuthData(token: String): Map[String, String] = {
    try {
      val request = Http(s"https://www.googleapis.com/oauth2/v3/tokeninfo")
        .param("id_token", token)
        .timeout(5000, 10000)
      parseAndVerifyResponse(request.asString)
    } catch {
      case e: SocketTimeoutException => throw new SocketTimeoutException("Timeout when getting google info")
      case e: UnsupportedError => throw e
      case e: Exception => throw new Exception("Error when getting google info", e)
    }
  }

  private def parseAndVerifyResponse(response: HttpResponse[String]) = {
    JSON.parseFull(response.body) match {
      case Some(s: Map[String, String]) =>
        verifyClientId(s)
        s
      case _ => throw new InternalError("Error when getting google info")
    }
  }

  private def verifyClientId(response: Map[String, String]): Unit = {
    val realClientId = response.getOrElse("aud", "")
    googleOauthConfig.clientIds.contains(realClientId) match {
      case true => response
      case false => throw UnsupportedError(s"Illegal token from client")
    }
  }


  override def isWhitelistEmail(oauthType: String, email: String): Future[Boolean] = Future {
    Utils.isWhitelistEmail(email, googleOauthConfig.whitelistEmail)
  }

  override def getOAuthConfig(): OAuthConfig = googleOauthConfig

  override def isActive(): Boolean = {
    googleOauthConfig.isActive
  }
}

case class FacebookOAuthProvider(fbOAuthInfo: FbOAuthConfig) extends OAuthProvider {
  def getOAuthInfo(facebookId: String, token: String): OAuthInfo = {
    if (isActive()) {
      val response = getFBOAuthData(token)
      val idRaw = response.get("id") match {
        case Some(s) => s
        case _ => throw new IllegalArgumentException("Illegal token!")
      }

      val (name, givenName, familyName) = OAuthProvider.parseName(
        response.get("name"),
        response.get("first_name"),
        response.get("last_name")
      )
      FbOAuthInfo(
        username = s"${OAuthType.FACEBOOK}-$idRaw",
        id = idRaw,
        token = token,
        password = "",
        name = name.getOrElse(""),
        familyName = familyName,
        givenName = givenName,
        email = response.getOrElse("email", ""),
        avatarUrl = "https://graph.facebook.com/" + idRaw + "/picture?type=large"
      )
    } else {
      throw new UnsupportedError("Login method unsupported")
    }

  }

  private def getFBOAuthData(token: String): Map[String, String] = {
    try {
      val appSecretProof = HmacUtils.hmacSha256Hex(fbOAuthInfo.appSecret, token)
      val request = Http("https://graph.facebook.com/me/")
        .param("access_token", token)
        .param("appsecret_proof", appSecretProof)
        .param("fields", "id,name,first_name,last_name,email")
        .timeout(5000, 10000)

      JSON.parseFull(request.asString.body) match {
        case Some(s: Map[String, String]) => s
        case _ => throw new InternalError("Error when getting facebook info")
      }

    } catch {
      case e: SocketTimeoutException => throw new SocketTimeoutException("Timeout when getting facebook info")
      case e: Exception => throw new Exception("Error when getting facebook info", e)
    }
  }

  override def isWhitelistEmail(oauthType: String, email: String): Future[Boolean] = Future {
    Utils.isWhitelistEmail(email, fbOAuthInfo.whitelistEmail)
  }

  override def getOAuthConfig(): OAuthConfig = fbOAuthInfo

  override def isActive(): Boolean = fbOAuthInfo.isActive
}

object OAuthProviderFactory {

  def create(oauthType: String, newConfig: OAuthConfig): OAuthProvider = {
    newConfig match {
      case googleOAuthConfig: GoogleOAuthConfig => GoogleOAuthProvider(googleOAuthConfig)
      case fbOAuthConfig: FbOAuthConfig => FacebookOAuthProvider(fbOAuthConfig)
      case _ => throw new UnsupportedOperationException("Unsupported login methods")
    }
  }
}



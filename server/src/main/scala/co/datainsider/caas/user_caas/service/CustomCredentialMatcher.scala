package co.datainsider.caas.user_caas.service

import co.datainsider.caas.user_caas.domain.{OrgAuthenticationInfo, OAuthAuthenticationInfo}
import org.apache.shiro.authc.credential.{HashedCredentialsMatcher, SimpleCredentialsMatcher}
import org.apache.shiro.authc.{AuthenticationInfo, AuthenticationToken}

import java.util.Objects

/**
  * @author sonpn
  */
class CustomCredentialMatcher extends SimpleCredentialsMatcher {

  override def doCredentialsMatch(token: AuthenticationToken, info: AuthenticationInfo): Boolean = {
    info match {
      case info: OrgAuthenticationInfo =>
        super.doCredentialsMatch(token, info)
      case info: OAuthAuthenticationInfo =>
        Objects.equals(token.getPrincipal.toString, info.userId)
      case _ => super.doCredentialsMatch(token, info)
    }
  }
}

/**
  * @author Andy
  * Currently use SHA256 with default iteration = 1
  * @param algorithmName
  */
case class CustomHashedCredentialMatcher(algorithmName: String) extends HashedCredentialsMatcher {
  setHashAlgorithmName(algorithmName)

  override def doCredentialsMatch(token: AuthenticationToken, info: AuthenticationInfo): Boolean = {
    info match {
      case info: OrgAuthenticationInfo =>
        super.doCredentialsMatch(token, info)
      case info: OAuthAuthenticationInfo =>
        Objects.equals(token.getPrincipal.toString, info.userId)
      case _ => super.doCredentialsMatch(token, info)
    }
  }
}

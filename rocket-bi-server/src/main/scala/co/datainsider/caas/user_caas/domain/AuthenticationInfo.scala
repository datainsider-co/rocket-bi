package co.datainsider.caas.user_caas.domain

import org.apache.shiro.authc.AuthenticationInfo
import org.apache.shiro.subject.{PrincipalCollection, SimplePrincipalCollection}

import scala.jdk.CollectionConverters.asJavaCollectionConverter

/**
  * @author andy
  */
@SerialVersionUID(1L)
case class OAuthAuthenticationInfo(organizationId: Long, userId: String, realmName: String) extends AuthenticationInfo {

  private lazy val principals = UserPrincipalCollection(organizationId, userId, realmName)

  override def getPrincipals: PrincipalCollection = {
    principals
  }

  override def getCredentials = null
}

@SerialVersionUID(1L)
case class OrgAuthenticationInfo(
    organizationId: Long,
    userId: String,
    credential: String,
    realmName: String
) extends AuthenticationInfo {

  private lazy val principals = OrgPrincipalCollection(organizationId, userId, realmName)

  override def getPrincipals: PrincipalCollection = {
    principals
  }

  override def getCredentials = credential
}

case class UserPrincipalCollection(organizationId: Long, username: String, realmName: String)
    extends SimplePrincipalCollection(Seq(username).asJavaCollection, realmName)

case class OrgPrincipalCollection(organizationId: Long, username: String, realmName: String)
    extends SimplePrincipalCollection(Seq(username).asJavaCollection, realmName)

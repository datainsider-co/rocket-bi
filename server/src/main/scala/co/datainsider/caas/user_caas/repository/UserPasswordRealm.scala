/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */ /*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package co.datainsider.caas.user_caas.repository

import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.caas.user_caas.domain._
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.repository.{OrganizationMemberRepository, OrganizationRepository}
import co.datainsider.common.client.exception.BadRequestError
import org.apache.shiro.authc._
import org.apache.shiro.authz.{AuthorizationInfo, SimpleAuthorizationInfo, UnauthenticatedException}
import org.apache.shiro.realm.jdbc.JdbcRealm
import org.apache.shiro.realm.jdbc.JdbcRealm.SaltStyle
import org.apache.shiro.subject.PrincipalCollection
import org.slf4j.LoggerFactory

import java.sql.SQLException
import scala.collection.mutable.ListBuffer
import scala.jdk.CollectionConverters.setAsJavaSetConverter

/**
  * @author sonpn
  * @since 08/2020 Convert to scala (andy)
  */
object UserPasswordRealm {
  protected val logger = LoggerFactory.getLogger(classOf[UserPasswordRealm])

  val AUTHENTICATION_QUERY = "SELECT password FROM caas.user WHERE username=? AND is_active=1"
  val USER_ROLE_QUERY =
    "SELECT role.role_name FROM caas.role,caas.user_roles,caas.user WHERE role.role_id=user_roles.role_id AND user_roles.username=user.username AND user.username=?"
  val PERMISSION_QUERY =
    "SELECT permission FROM caas.role_permissions,role WHERE role_permissions.role_id=role.role_id AND role.role_name=?"
}

case class UserPasswordRealm(
    userRepository: UserRepository,
    roleRepository: RoleRepository,
    organizationRepository: OrganizationRepository,
    orgMemberRepository: OrganizationMemberRepository
) extends JdbcRealm {

  setAuthenticationQuery(UserPasswordRealm.AUTHENTICATION_QUERY)
  setUserRolesQuery(UserPasswordRealm.USER_ROLE_QUERY)
  setPermissionsQuery(UserPasswordRealm.PERMISSION_QUERY)
  setSaltStyle(SaltStyle.NO_SALT)

  import org.apache.shiro.authc.AuthenticationToken

  override def supports(token: AuthenticationToken): Boolean = {
    token match {
      case _: OrgAuthenticationToken   => true
      case _: OAuthAuthenticationToken => true
      case _                           => false
    }
  }

  override protected def doGetAuthenticationInfo(token: AuthenticationToken): AuthenticationInfo = {
    token match {
      case token: OrgAuthenticationToken   => getOrgAuthenticationInfo(token)
      case token: OAuthAuthenticationToken => getUserAuthenticationInfo(token)
      case _                               => throw BadRequestError("unsupported token")
    }

  }

  override protected def doGetAuthorizationInfo(principals: PrincipalCollection): AuthorizationInfo = {
    principals match {
      case principals: OrgPrincipalCollection  => getOrgAuthorizationInfo(principals)
      case principals: UserPrincipalCollection => getUserAuthorizationInfo(principals)
      case _                                   => throw BadRequestError("unsupported principle")
    }
  }

  private def getOrgAuthenticationInfo(orgAuthToken: OrgAuthenticationToken): AuthenticationInfo = {
    val organizationId = orgAuthToken.organizationId
    val username = orgAuthToken.getUsername

    try {
      if (username == null)
        throw new AccountException("Null username are not allowed by this realm.")

      checkIsOrgActive(organizationId)
      checkIsUserActive(organizationId, username)
      checkUserBelongToOrg(organizationId, username)

      val password = userRepository.getUserInfo(organizationId, username).syncGet().password
      OrgAuthenticationInfo(organizationId, username, password, getName)
    } catch {
      case e: SQLException =>
        val message = "There was a SQL error while authenticating user [" + username + "]"
        if (UserPasswordRealm.logger.isErrorEnabled)
          UserPasswordRealm.logger.error(message, e)
        // Rethrow any SQL errors as an authentication exception
        throw new AuthenticationException(message, e)
      case e => throw new AuthenticationException(e)
    }
  }

  private def getUserAuthenticationInfo(oauthToken: OAuthAuthenticationToken): AuthenticationInfo = {
    val organizationId = oauthToken.organizationId
    val username = oauthToken.getUsername

    try {
      if (username == null)
        throw new AccountException("Null username are not allowed by this realm.")

      checkIsOrgActive(organizationId)
      checkIsUserActive(organizationId, username)
      checkUserBelongToOrg(organizationId, username)

      OAuthAuthenticationInfo(organizationId, username, getName)
    } catch {
      case e: SQLException =>
        val message = "There was a SQL error while authenticating user [" + username + "]"
        if (UserPasswordRealm.logger.isErrorEnabled)
          UserPasswordRealm.logger.error(message, e)
        // Rethrow any SQL errors as an authentication exception
        throw new AuthenticationException(message, e)
    }
  }

  private def checkUserBelongToOrg(organizationId: Long, username: String): Unit = {
    val isBelongToOrg = userRepository.isExistUser(organizationId, username)
    if (!isBelongToOrg)
      throw new UnauthenticatedException("this user does not belong to current organization")
  }

  private def checkIsOrgActive(orgId: Long): Unit = {
    val org: Option[Organization] = organizationRepository.getOrganization(orgId)
    if (org.isEmpty || !org.get.isActive)
      throw new UnknownAccountException(s"Organization $orgId is being deactivated.")
  }

  private def checkIsUserActive(organizationId: Long, username: String): Unit = {
    val isActive = userRepository.isActiveUsername(organizationId, username)
    if (!isActive)
      throw new UnknownAccountException(s"User $username does not exists or is being deactivated")
  }

  private def getOrgAuthorizationInfo(principals: OrgPrincipalCollection): AuthorizationInfo = {
    val roleInfos = userRepository.syncGetActiveRoles(principals.organizationId, principals.username)

    val roleIds = roleInfos.map(_.id)
    val roleNames = roleInfos.map(_.name)
    val permissions = getPermissions(principals.organizationId, principals.username, roleIds)

    val authorizationInfo = new SimpleAuthorizationInfo(roleNames.toSet.asJava)
    authorizationInfo.setStringPermissions(permissions)
    authorizationInfo
  }

  private def getUserAuthorizationInfo(principals: UserPrincipalCollection): AuthorizationInfo = {
    val orgId: Long = principals.organizationId
    val roleInfos = userRepository.syncGetActiveRoles(orgId, principals.username)

    val roleIds = roleInfos.map(_.id)
    val roleNames = roleInfos.map(_.name)
    val permissions = getPermissions(orgId, principals.username, roleIds)

    val authorizationInfo = new SimpleAuthorizationInfo(roleNames.toSet.asJava)
    authorizationInfo.setStringPermissions(permissions)

    authorizationInfo
  }

  private def getPermissions(organizationId: Long, username: String, roleIds: Seq[Int]) = {
    val permissions = ListBuffer.empty[String]

    permissions.appendAll(roleRepository.getRolePermissionByRoleIds(organizationId, roleIds))
    permissions.appendAll(userRepository.syncGetUserPermissions(organizationId, username))

    if (organizationId <= 0) {
      permissions.appendAll(userRepository.syncGetUserPermissions(0, username))
    }
    permissions.toSet.asJava
  }
}

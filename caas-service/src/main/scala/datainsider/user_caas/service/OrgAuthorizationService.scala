package datainsider.user_caas.service

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.user.{RoleInfo, User}
import datainsider.user_caas.domain.Page
import datainsider.user_caas.repository.{RoleRepository, UserRepository}

import javax.inject.Inject

trait OrgAuthorizationService {

  def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean]

  def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean]

  def getActiveRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]]

  def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean]

  def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]]

  def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean]

  def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String]
  ): Future[Boolean]

  def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]]

  def isPermitted(organizationId: Long, username: String, permissions: String): Future[Boolean]

  def isPermitted(organizationId: Long, username: String, permissions: String*): Future[Map[String, Boolean]]

  def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean]

  def isPermittedAtLeastOnce(organizationId: Long, username: String, permissions: String*): Future[Boolean]
}

case class OrgAuthorizationServiceImpl @Inject() (
    caas: Caas,
    userRepository: UserRepository,
    roleRepository: RoleRepository
) extends OrgAuthorizationService
    with Logging {

  override def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean] =
    Future {
      userRepository.addRoles(organizationId, username, roleIds)
    }

  override def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean] =
    Future {
      userRepository.removeUserRoles(organizationId, username, roleIds)
      true
    }

  override def getActiveRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]] = {
    userRepository.getAssignedRoles(organizationId, username).map(_.filterNot(_.isExpired))
  }



  override def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean] =
    Future {
      caas.hasRole(organizationId, username, roleName)
    }

  override def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]] =
    Future {
      val results = caas.hasRoles(organizationId, username, roleName)
      roleName
        .zip(results)
        .map {
          case (roleName, isPermitted) => (roleName -> isPermitted)
        }
        .toMap
    }

  override def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean] =
    Future {
      caas.hasAllRoles(organizationId, username, roleName)
    }

  override def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String]
  ): Future[Boolean] = {
    for {
      removeOK <- removePermissions(organizationId, username, excludePermissions)
      addOK <- addPermissions(organizationId, username, includePermissions)
    } yield addOK && removeOK
  }

  override def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    Future {
      userRepository.insertUserPermissions(organizationId, username, permissions.toSet)
    }.onFailure { ex =>
      error(s"addPermissions: $permissions", ex)
    }
  }

  override def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] =
    Future {
      userRepository.deleteUserPermissions(organizationId, username, permissions.toSet)
    }

  override def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]] = {
    Future {
      val perms = userRepository.getAllPermissions(organizationId, username)
      val userPerms = userRepository.getAllPermissions(0, username)
      (perms ++ userPerms).distinct
    }
  }

  override def isPermitted(organizationId: Long, username: String, permissions: String): Future[Boolean] =
    Future {
      caas.isPermitted(organizationId, username, permissions)
    }

  override def isPermitted(organizationId: Long, username: String, permissions: String*): Future[Map[String, Boolean]] =
    Future {
      val results = caas.isPermitted(organizationId, username, permissions: _*)
      permissions
        .zip(results)
        .map {
          case (permission, isPermitted) => (permission -> isPermitted)
        }
        .toMap
    }

  override def isPermittedAtLeastOnce(organizationId: Long, username: String, permissions: String*): Future[Boolean] = {
    isPermitted(organizationId, username, permissions: _*).map(response => {
      response.exists(_._2)
    })
  }

  override def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean] =
    Future {
      caas.isPermittedAll(organizationId, username, permissions: _*)
    }

}

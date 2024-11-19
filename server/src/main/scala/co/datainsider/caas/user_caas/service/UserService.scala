package co.datainsider.caas.user_caas.service

import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.user.{RoleInfo, User}
import co.datainsider.common.client.exception.AlreadyExistError
import co.datainsider.caas.user_caas.domain.PasswordMode.PasswordMode
import co.datainsider.caas.user_caas.domain.UserType.UserType
import co.datainsider.caas.user_caas.domain.{Page, PasswordMode}
import co.datainsider.caas.user_caas.repository.UserRepository

import javax.inject.Inject

trait UserService {

  def createUser(
      organizationId: Long,
      username: String,
      password: String,
      passwordMode: Option[PasswordMode] = None,
      userType: Option[UserType] = None
  ): Future[User]

  def isUserActive(organizationId: Long, username: String, password: String): Future[Boolean]

  def isPasswordCorrect(organizationId: Long, username: String, password: String): Future[Boolean]

  def setPassword(
      organizationId: Long,
      username: String,
      password: String,
      passwordMode: Option[PasswordMode] = None
  ): Future[Boolean]

  def listActiveUserIds(organizationId: Long, from: Int, size: Int): Future[Page[String]]

  def listUserIds(organizationId: Long, isActive: Option[Boolean], from: Int, size: Int): Future[Page[String]]

  def getUserInfo(organizationId: Long, username: String): Future[User]

  def changeUserActiveStatus(organizationId: Long, username: String, isActive: Boolean): Future[Boolean]

  def transferRoles(organizationId: Long, fromUser: String, toUser: String): Future[Boolean]

  def transferPermissions(organizationId: Long, fromUser: String, toUser: String): Future[Boolean]

  def deleteUser(organizationId: Long, username: String): Future[Unit]

  def getAllUserWithRoleInfo(organizationId: Long, isActive: Option[Boolean], from: Int, size: Int): Future[Page[User]]

  def getListUserByRoles(
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]] = None,
      inRoleIds: Option[Seq[Int]] = None,
      from: Int,
      size: Int
  ): Page[User]

  def searchListUserByRoles(
      keyword: String,
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Page[User]

  def getListUserByUsernames(organizationId: Long, usernames: Seq[String]): Future[Seq[User]]
}

case class UserServiceImpl @Inject() (
    passwordHashGenerator: HashGenerator,
    userRepository: UserRepository
) extends UserService {

  override def createUser(
      organizationId: Long,
      username: String,
      password: String,
      passwordMode: Option[PasswordMode] = None,
      userType: Option[UserType] = None
  ): Future[User] = {
    Future {
      userRepository.isExistUser(organizationId, username) match {
        case true => throw AlreadyExistError(s"User [$username] already exist.")
        case _ =>
          val passwordHashed = getPasswordHash(passwordMode.getOrElse(PasswordMode.Raw), password)
          userRepository.insertUser(organizationId, username, passwordHashed, true, System.currentTimeMillis, userType)
      }
    }
  }
  private def getPasswordHash(passwordMode: PasswordMode, passStr: String): String = {
    passwordHashGenerator.getHash(passwordMode, passStr)
  }

  override def isUserActive(organizationId: Long, username: String, password: String) = {
    Future {
      userRepository.isActiveUser(organizationId, username, getPasswordHash(PasswordMode.Raw, password))
    }
  }

  override def isPasswordCorrect(organizationId: Long, username: String, password: String) = {
    Future {
      val passwordHashed = getPasswordHash(PasswordMode.Raw, password)
      userRepository.isPasswordCorrect(organizationId, username, passwordHashed)
    }
  }

  override def setPassword(
      organizationId: Long,
      username: String,
      password: String,
      passwordMode: Option[PasswordMode] = None
  ): Future[Boolean] =
    Future {
      val passwordHashed = getPasswordHash(passwordMode.getOrElse(PasswordMode.Raw), password)
      userRepository.setPassword(organizationId, username, passwordHashed)
    }

  override def listActiveUserIds(organizationId: Long, from: Int, size: Int): Future[Page[String]] = {
    Future {
      userRepository.listUserIds(organizationId, Some(true), from, size)
    }
  }

  override def listUserIds(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int
  ): Future[Page[String]] = {
    Future {
      userRepository.listUserIds(organizationId, isActive, from, size)
    }
  }

  override def getUserInfo(organizationId: Long, username: String): Future[User] = {
    userRepository.getUserInfo(organizationId, username)
  }

  override def changeUserActiveStatus(organizationId: Long, username: String, isActive: Boolean): Future[Boolean] = {
    Future {
      userRepository.changeUserActiveStatus(organizationId, username, isActive)
    }
  }

  override def deleteUser(organizationId: Long, username: String): Future[Unit] = {
    Future {
      userRepository.deleteUser(organizationId, username)
    }
  }

  override def transferRoles(organizationId: Long, fromUser: String, toUser: String): Future[Boolean] = {
    for {
      roles <- userRepository.getAssignedRoles(organizationId, fromUser)
      transferOK <- addRoles(organizationId, toUser, roles)
    } yield transferOK
  }

  private def addRoles(organizationId: Long, username: String, roleIds: Seq[RoleInfo]): Future[Boolean] = {
    Future {
      val roleIdMap = roleIds.map(role => role.id -> role.expiredTime).toMap
      userRepository.addRoles(organizationId, username, roleIdMap)
    }
  }

  override def transferPermissions(organizationId: Long, fromUser: String, toUser: String): Future[Boolean] = {
    for {
      permissions <- userRepository.getUserPermissions(organizationId, fromUser)
      transferOK = userRepository.insertUserPermissions(organizationId, toUser, permissions.toSet)
    } yield transferOK
  }

  override def getListUserByRoles(
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]] = None,
      inRoleIds: Option[Seq[Int]] = None,
      from: Int,
      size: Int
  ): Page[User] = {
    val cvtNotInRoleIds = notInRoleIds match {
      case Some(x) => x.toList
      case _       => List.empty
    }
    val cvtInRoleIds = inRoleIds match {
      case Some(x) => x.toList
      case _       => List.empty
    }

    userRepository.getListUserRoleInfoWithHighestRoleFilter(
      organizationId,
      cvtNotInRoleIds,
      cvtInRoleIds,
      from,
      size
    )
  }

  override def searchListUserByRoles(
      keyword: String,
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Page[User] = {
    val cvtNotInRoleIds = notInRoleIds match {
      case Some(x) => x.toList
      case _       => List.empty
    }
    val cvtInRoleIds = inRoleIds match {
      case Some(x) => x.toList
      case _       => List.empty
    }

    userRepository.searchUserRoleInfoWithHighestRoleFilter(
      keyword,
      organizationId,
      cvtNotInRoleIds,
      cvtInRoleIds,
      from,
      size
    )
  }

  override def getAllUserWithRoleInfo(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int
  ): Future[Page[User]] = {
    Future {
      userRepository.getAllUserWithRoleInfo(organizationId, isActive, from, size)
    }
  }

  override def getListUserByUsernames(organizationId: Long, usernames: Seq[String]): Future[Seq[User]] =
    Future {
      if (usernames.isEmpty) {
        Seq.empty[User]
      } else {
        userRepository.getListUserByUsernames(organizationId, usernames)
      }
    }
}

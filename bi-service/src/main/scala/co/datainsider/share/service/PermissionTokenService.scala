package co.datainsider.share.service

import co.datainsider.bi.domain.{PermissionToken, TokenFullInfo}
import co.datainsider.share.controller.request.GetOrCreatePermissionTokenRequest
import co.datainsider.share.repository.{ObjectTokenRepository, PermissionTokenManager}
import com.google.inject.Inject
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.exception.NotFoundError

trait PermissionTokenService {

  def getTokenId(objectType: String, objectId: String): Future[Option[String]]

  def getOrCreateToken(request: GetOrCreatePermissionTokenRequest): Future[String]

  def deleteToken(objectType: String, objectId: String): Future[Boolean]

  def getToken(tokenId: String): Future[PermissionToken]

  def getFullInfo(tokenId: String): Future[Option[TokenFullInfo]]

  def getToken(objectType: String, objectId: String): Future[Option[PermissionToken]]

  def updatePermission(tokenId: String, permissions: Seq[String]): Future[Boolean]

  def isPermitted(tokenId: String, permission: String): Future[Boolean]

  def isPermitted(tokenId: String, permissions: Seq[String]): Future[Seq[Boolean]]

  def isPermittedAll(tokenId: String, permissions: Seq[String]): Future[Boolean]

  def deleteToken(tokenId: String): Future[Boolean]
}

class PermissionTokenServiceImpl @Inject() (
    permissionTokenManager: PermissionTokenManager,
    objectTokenRepository: ObjectTokenRepository
) extends PermissionTokenService {

  override def getOrCreateToken(
      request: GetOrCreatePermissionTokenRequest
  ): Future[String] = {
    getTokenId(request.objectType, request.objectId)
      .flatMap {
        case Some(tokenId) => Future.value(tokenId)
        case _ =>
          createPermissionToken(
            request.currentUser.username,
            request.objectType,
            request.objectId,
            request.permissions.getOrElse(Seq.empty)
          )
      }
  }

  override def getTokenId(objectType: String, objectId: String): Future[Option[String]] = {
    objectTokenRepository.getTokenId(objectType, objectId)
  }

  private def createPermissionToken(
      username: String,
      objectType: String,
      objectId: String,
      permissions: Seq[String]
  ): Future[String] = {
    for {
      tokenId <- permissionTokenManager.create(username, permissions).map(_.tokenId)
      _ <- objectTokenRepository.addTokenId(objectType, objectId, tokenId).transform {
        case Return(r) => Future.value(r)
        case Throw(e) =>
          permissionTokenManager.delete(tokenId).map(_ => throw e)
      }
    } yield {
      tokenId
    }
  }

  override def deleteToken(tokenId: String): Future[Boolean] = {
    permissionTokenManager.delete(tokenId)
  }

  override def getToken(tokenId: String): Future[PermissionToken] = {
    permissionTokenManager.get(tokenId).map(tokenShouldExist)
  }

  private def tokenShouldExist(
      token: Option[PermissionToken]
  ): PermissionToken = {
    token match {
      case Some(x) => x
      case _       => throw NotFoundError(s"this token not found")
    }
  }

  override def updatePermission(
      tokenId: String,
      permissions: Seq[String]
  ): Future[Boolean] = {
    permissionTokenManager.updatePermissions(tokenId, permissions)
  }

  override def isPermitted(
      tokenId: String,
      permission: String
  ): Future[Boolean] = {
    permissionTokenManager.isPermitted(tokenId, permission)
  }

  override def isPermitted(
      tokenId: String,
      permissions: Seq[String]
  ): Future[Seq[Boolean]] = {
    permissionTokenManager.isPermitted(tokenId, permissions)
  }

  override def isPermittedAll(
      tokenId: String,
      permissions: Seq[String]
  ): Future[Boolean] = {
    permissionTokenManager.isPermittedAll(tokenId, permissions)
  }

  override def deleteToken(
      objectType: String,
      objectId: String
  ): Future[Boolean] = {
    for {
      tokenId <- objectTokenRepository.getTokenId(objectType, objectId)
      _ <- objectTokenRepository.delete(objectType, objectId)
      tokenDeleted <- tokenId.fold(Future.True)(permissionTokenManager.delete)
    } yield {
      tokenDeleted
    }
  }

  override def getToken(objectType: String, objectId: String): Future[Option[PermissionToken]] = {
    getTokenId(objectType, objectId)
      .flatMap {
        case Some(tokenId) => getToken(tokenId).map(Some(_))
        case _             => Future.None
      }
  }

  override def getFullInfo(tokenId: String): Future[Option[TokenFullInfo]] = {
    permissionTokenManager.getFullInfo(tokenId)
  }
}

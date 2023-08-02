package co.datainsider.bi.service

import co.datainsider.bi.domain.Ids.OrganizationId
import co.datainsider.bi.domain.request.DeleteUserDataRequest
import co.datainsider.caas.user_profile.client.ProfileClientService
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{BadRequestError, NotFoundError}
import co.datainsider.schema.client.SchemaClientService

/**
  * created 2023-01-11 3:15 PM
  *
  * @author tvc12 - Thien Vi
  */
trait AdminService {

  /**
    * delete user data, if transferToUsername is not empty, then transfer data to that user
    */

  @throws[NotFoundError]("if username or transfer is not found")
  @throws[BadRequestError]("if transfer data to itself")
  def delete(request: DeleteUserDataRequest): Future[Boolean]
}

class AdminServiceImpl @Inject() (
    directoryService: DirectoryService,
    profileClientService: ProfileClientService
) extends AdminService
    with Logging {

  override def delete(request: DeleteUserDataRequest): Future[Boolean] = {
    request.transferToEmail match {
      case Some(email) => handleTransfer(request.getOrganizationId(), request.username, email)
      case None        => handleDelete(request.getOrganizationId(), request.username)
    }
  }

  private def handleDelete(orgId: OrganizationId, username: String): Future[Boolean] = {
    for {
      isDeletedUserData <- deleteUserData(orgId, username)
      isDeleteUser <- deleteUser(orgId, username, None)
    } yield {
      true
    }
  }

  private def handleTransfer(orgId: OrganizationId, username: String, email: String): Future[Boolean] = {
    for {
      toUsername <- getUsernameByEmail(orgId, email)
      _ <- ensureTransferNotSelf(username, toUsername)
      isTransfer <- transfer(orgId, username, toUsername)
      isDeletedUser <- deleteUser(orgId, username, Some(email))
    } yield {
      true
    }
  }

  private def ensureTransferNotSelf(username: String, toUsername: String): Future[Unit] = {
    if (username.trim() == toUsername.trim()) {
      Future.exception(BadRequestError(s"Source and target are the same account."))
    } else {
      Future.Unit
    }
  }

  private def getUsernameByEmail(organizationId: OrganizationId, email: String): Future[String] = {
    profileClientService.getProfileByEmail(organizationId, email).flatMap {
      case Some(profile) => Future.value(profile.username)
      case None          => Future.exception(NotFoundError(s"User with email $email is not found"))
    }
  }

  private def deleteUser(
      organizationId: OrganizationId,
      username: String,
      transferToEmail: Option[String]
  ): Future[Boolean] = {
    profileClientService
      .deleteUser(organizationId, username, transferToEmail)
      .rescue {
        case ex: Throwable =>
          logger.error(s"Delete user $username in org $organizationId failed", ex)
          Future.False
      }
  }
  private def deleteUserData(orgId: OrganizationId, username: String): Future[Boolean] = {
    val result: Future[Boolean] = for {
      _ <- directoryService.deleteUserData(orgId, username)
    } yield true
    result.rescue {
      case e: Exception =>
        error(s"Delete user data of ${username} failed: ${e.getMessage}", e)
        Future.False
    }
  }
  private def transfer(orgId: OrganizationId, fromUsername: String, toUsername: String): Future[Boolean] = {
    val result: Future[Boolean] = for {
      _ <- directoryService.transferData(orgId, fromUsername, toUsername)
    } yield true
    result.rescue {
      case ex: Exception =>
        logger.error(s"transfer user data from ${fromUsername} to ${toUsername} failed", ex)
        Future.False
    }
  }
}

class MockAdminService() extends AdminService {

  /**
    * delete user data, if transferToUsername is not empty, then transfer data to that user
    */
  override def delete(request: DeleteUserDataRequest): Future[Boolean] = Future.True

}

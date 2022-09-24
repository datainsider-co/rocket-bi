package co.datainsider.share.service

import co.datainsider.bi.domain.Ids.{DashboardId, OrganizationId}
import co.datainsider.bi.domain.request.ListDirectoriesRequest
import co.datainsider.bi.domain.{Directory, DirectoryType}
import co.datainsider.bi.service.DirectoryService
import datainsider.profiler.Profiler
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.service.OrgAuthorizationClientService

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author tvc12 - Thien Vi
  * @created 03/22/2021 - 6:11 PM
  */
trait DashboardPermissionService {
  def isPermitted(
      orgId: Long,
      username: String,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean]

  def isPermitted(
      orgId: Long,
      username: String,
      dashboardId: DashboardId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]]

  def isPermitted(tokenId: String, orgId: Long, dashboardId: DashboardId, action: String): Future[Boolean]
  def isPermitted(
      tokenId: String,
      orgId: Long,
      dashboardId: DashboardId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]]

}

case class DashboardPermissionServiceImpl @Inject() (
    authorizationService: OrgAuthorizationClientService,
    directoryPermissionService: DirectoryPermissionService,
    directoryService: DirectoryService,
    tokenService: PermissionTokenService
) extends DashboardPermissionService {
  override def isPermitted(
      orgId: Long,
      username: String,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean] =
    Profiler("[service::DashboardPermissionService]::isPermittedAction") {
      Seq[(Long, String, DashboardId, String) => Future[Boolean]](isPermittedDirectory)
        .foldLeft(Future.False)((r, fn) => {
          r.flatMap {
            case true => r
            case _    => fn(orgId, username, dashboardId, action)
          }
        })
    }

  private def getDirectory(orgId: DashboardId, dashboardId: DashboardId): Future[Option[Directory]] = {
    for {
      r <- directoryService.list(ListDirectoriesRequest(dashboardId = Option(dashboardId)))
    } yield r.headOption
  }

  private def isPermittedDirectory(
      orgId: Long,
      username: String,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean] = {
    for {
      directory <- getDirectory(orgId, dashboardId)
      r <- directory match {
        case Some(directory) => directoryPermissionService.isPermitted(orgId, username, directory.id, action)
        case _               => Future.False
      }
    } yield r
  }

  def isTokenPermittedDashboard(
      orgId: Long,
      tokenId: String,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean] = {
    val permission: String =
      PermissionProviders.permissionBuilder.perm(orgId, DirectoryType.Dashboard.toString, action, dashboardId.toString)
    tokenService.isPermitted(tokenId, permission)
  }

  private def isTokenPermittedDirectory(
      orgId: Long,
      tokenId: String,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean] = {
    for {
      mayBeDirectory <- getDirectory(orgId, dashboardId)
      r <- mayBeDirectory match {
        case Some(directory) => directoryPermissionService.isPermitted(tokenId, orgId, directory.id, action)
        case _               => Future.False
      }
    } yield r
  }

  override def isPermitted(
      tokenId: String,
      orgId: OrganizationId,
      dashboardId: DashboardId,
      action: String
  ): Future[Boolean] =
    Profiler("[service::DashboardPermissionService]::isPermittedActionByToken") {
      Seq[(Long, String, DashboardId, String) => Future[Boolean]](isTokenPermittedDashboard, isTokenPermittedDirectory)
        .foldLeft(Future.False)((r, fn) => {
          r.flatMap {
            case true => r
            case _    => fn(orgId, tokenId, dashboardId, action)
          }
        })
    }

  override def isPermitted(
      orgId: DashboardId,
      username: String,
      dashboardId: DashboardId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] =
    Profiler("[service::DashboardPermissionService]::isPermittedActions") {
      val fn = actions
        .map(action => {
          action -> isPermitted(orgId, username, dashboardId, action)
        })
        .toMap
      Future.collect(fn)
    }

  override def isPermitted(
      tokenId: String,
      orgId: DashboardId,
      dashboardId: DashboardId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] =
    Profiler("[service::DashboardPermissionService]::isPermittedActionsByToken") {
      val fn = actions
        .map(action => {
          action -> isPermitted(tokenId, orgId, dashboardId, action)
        })
        .toMap
      Future.collect(fn)
    }
}

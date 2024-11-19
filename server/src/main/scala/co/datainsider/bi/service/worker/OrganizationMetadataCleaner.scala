package co.datainsider.bi.service.worker

import co.datainsider.bi.service._
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.share.service.ShareService
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import javax.inject.Inject

/**
  * created 2023-12-07 5:33 PM
  *
  * @author tvc12 - Thien Vi
  */
trait OrganizationMetadataCleaner {

  /**
    * clean everything related to organization
    */
  def clean(organizationId: Long): Unit
}

class OrganizationMetadataCleanerImpl @Inject() (
    connectionService: ConnectionService,
    dashboardService: DashboardService,
    directoryService: DirectoryService,
    shareService: ShareService,
    recentDirectoryService: RecentDirectoryService,
    deletedDirectoryService: DeletedDirectoryService,
    relationshipService: RelationshipService,
    rlsPolicyService: RlsPolicyService,
    sshKeyService: KeyPairService,
    starredDirectoryService: StarredDirectoryService,
    userActivityService: UserActivityService
) extends OrganizationMetadataCleaner
    with Logging {
  override def clean(orgId: Long): Unit = {
    silentExecute(connectionService.delete(orgId))
    silentExecute(dashboardService.cleanup(orgId))
    silentExecute(directoryService.cleanup(orgId))
    silentExecute(shareService.cleanup(orgId))
    silentExecute(recentDirectoryService.cleanup(orgId))
    silentExecute(deletedDirectoryService.cleanup(orgId))
    silentExecute(relationshipService.cleanup(orgId))
    silentExecute(rlsPolicyService.cleanup(orgId))
    silentExecute(sshKeyService.cleanup(orgId))
    silentExecute(starredDirectoryService.cleanup(orgId))
    silentExecute(userActivityService.cleanup(orgId))
  }

  private def silentExecute(cleaner: => Future[Any]): Unit = {
    cleaner
      .rescue({
        case ex: Throwable => {
          logger.error(s"Error when clean expired license: ${ex.getMessage}")
          Future.Unit
        }
      })
      .syncGet()
  }
}

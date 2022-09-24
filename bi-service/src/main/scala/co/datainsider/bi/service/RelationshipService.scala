package co.datainsider.bi.service

import co.datainsider.bi.domain.{Relationship, RelationshipInfo}
import co.datainsider.bi.domain.query.QueryView
import co.datainsider.bi.repository.RelationshipRepository
import com.google.inject.Inject
import com.twitter.util.Future

trait RelationshipService {

  // global relationships
  def getGlobal(orgId: Long): Future[RelationshipInfo]

  def createOrUpdateGlobal(orgId: Long, relationshipInfo: RelationshipInfo): Future[Boolean]

  def deleteGlobal(orgId: Long): Future[Boolean]

  // dashboard relationship
  def get(orgId: Long, dashboardId: Long): Future[RelationshipInfo]

  def createOrUpdate(orgId: Long, dashboardId: Long, dashboardRelationship: RelationshipInfo): Future[Boolean]

  def delete(orgId: Long, dashboardId: Long): Future[Boolean]
}

class RelationshipServiceImpl @Inject() (
    relationshipRepository: RelationshipRepository,
    dashboardService: DashboardService
) extends RelationshipService {

  override def getGlobal(orgId: Long): Future[RelationshipInfo] = {
    relationshipRepository.get(getOrgKey(orgId)).map {
      case Some(relationship) => relationship
      case None               => RelationshipInfo(Seq.empty, Seq.empty)
    }
  }

  override def createOrUpdateGlobal(orgId: Long, relationshipInfo: RelationshipInfo): Future[Boolean] = {
    relationshipRepository.createOrUpdate(getOrgKey(orgId), relationshipInfo)
  }

  override def deleteGlobal(orgId: Long): Future[Boolean] = {
    relationshipRepository.delete(getOrgKey(orgId))
  }

  override def get(orgId: Long, dashboardId: Long): Future[RelationshipInfo] = {
    for {
      allViews <- dashboardService.get(orgId, dashboardId).map(_.getAllQueryViews)
      currentRelationshipInfo <- relationshipRepository.get(getDashboardKey(orgId, dashboardId))
      globalRelationship <- getGlobal(orgId)
    } yield {
      currentRelationshipInfo match {
        case Some(relationshipInfo) =>
          relationshipInfo.copy(
            views = allViews,
            relationships = (relationshipInfo.relationships ++ globalRelationship.relationships).distinct
          )
        case None => RelationshipInfo(allViews, globalRelationship.relationships)
      }
    }
  }

  override def createOrUpdate(
      orgId: Long,
      dashboardId: Long,
      dashboardRelationship: RelationshipInfo
  ): Future[Boolean] = {
    relationshipRepository.createOrUpdate(getDashboardKey(orgId, dashboardId), dashboardRelationship)
  }

  override def delete(orgId: Long, dashboardId: Long): Future[Boolean] = {
    relationshipRepository.delete(getDashboardKey(orgId, dashboardId))
  }

  private def populateWithGlobalRelationship(
      queryViews: Seq[QueryView],
      globalRelationship: RelationshipInfo
  ): Seq[Relationship] = {
    globalRelationship.relationships.filter(relationship => {
      queryViews.exists(view => {
        val curViewName = view.aliasName
        val firstViewName = relationship.firstView.aliasName
        val secondViewName = relationship.secondView.aliasName

        curViewName == firstViewName || curViewName == secondViewName
      })
    })
  }

  private def getDashboardKey(orgId: Long, dashboardId: Long): String = {
    s"org_${orgId}_dashboard_${dashboardId}"
  }

  private def getOrgKey(orgId: Long): String = {
    s"org_${orgId}_global"
  }
}

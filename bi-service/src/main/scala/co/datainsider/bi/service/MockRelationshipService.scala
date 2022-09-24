package co.datainsider.bi.service
import co.datainsider.bi.domain.RelationshipInfo
import com.twitter.util.Future

import scala.collection.mutable

class MockRelationshipService extends RelationshipService {
  private val relationshipMap = mutable.Map[Long, RelationshipInfo]()

  override def getGlobal(orgId: Long): Future[RelationshipInfo] = ???

  override def createOrUpdateGlobal(orgId: Long, relationshipInfo: RelationshipInfo): Future[Boolean] = ???

  override def deleteGlobal(orgId: Long): Future[Boolean] = ???

  override def get(orgId: Long, dashboardId: Long): Future[RelationshipInfo] =
    Future {
      relationshipMap.getOrElse(dashboardId, RelationshipInfo(Seq.empty, Seq.empty))
    }

  override def createOrUpdate(
      orgId: Long,
      dashboardId: Long,
      dashboardRelationship: RelationshipInfo
  ): Future[Boolean] =
    Future {
      relationshipMap.put(dashboardId, dashboardRelationship)
      true
    }

  override def delete(orgId: Long, dashboardId: Long): Future[Boolean] =
    Future {
      relationshipMap.remove(dashboardId)
      true
    }
}

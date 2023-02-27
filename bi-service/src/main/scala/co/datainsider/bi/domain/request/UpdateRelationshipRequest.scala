package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.{Relationship, RelationshipInfo}
import co.datainsider.bi.domain.query.QueryView
import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest

case class UpdateRelationshipRequest(
    views: Seq[QueryView],
    relationships: Seq[Relationship],
    extraData: Map[String, Any] = Map.empty,
    request: Request = null
) extends LoggedInRequest {

  def toRelationshipInfo: RelationshipInfo = {
    RelationshipInfo(
      views = views,
      relationships = relationships,
      extraData = extraData
    )
  }

}

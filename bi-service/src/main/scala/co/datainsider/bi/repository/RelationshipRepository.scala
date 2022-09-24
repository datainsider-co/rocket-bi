package co.datainsider.bi.repository

import co.datainsider.bi.domain.RelationshipInfo
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.client.util.JsonParser
import education.x.commons.SsdbKVS

import scala.concurrent.ExecutionContext.Implicits.global

trait RelationshipRepository {
  def get(key: String): Future[Option[RelationshipInfo]]

  def createOrUpdate(key: String, relationshipInfo: RelationshipInfo): Future[Boolean]

  def delete(key: String): Future[Boolean]
}

class SsdbRelationshipRepository(kvs: SsdbKVS[String, String]) extends RelationshipRepository {
  override def get(key: String): Future[Option[RelationshipInfo]] = {
    kvs.get(key).asTwitter.map {
      case Some(relationshipInfoAsJson) => Some(JsonParser.fromJson[RelationshipInfo](relationshipInfoAsJson))
      case None                         => None
    }
  }

  override def createOrUpdate(key: String, relationshipInfo: RelationshipInfo): Future[Boolean] = {
    kvs.add(key, JsonParser.toJson(relationshipInfo)).asTwitter
  }

  override def delete(key: String): Future[Boolean] = {
    kvs.remove(key).asTwitter
  }
}

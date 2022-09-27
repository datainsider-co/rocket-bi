package datainsider.schema.repository

import com.twitter.util.Future
import datainsider.client.exception.NotFoundError
import datainsider.schema.domain.ApiKeyInfo
import datainsider.schema.util.Implicits.ScalaFutureLike
import education.x.commons.{SsdbKVS, SsdbSortedSet}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

/**
  * @author andy
  * @since 7/15/20
  */
trait ApiKeyRepository {

  def add(apiKeyInfo: ApiKeyInfo): Future[Boolean]

  def get(apiKey: String): Future[ApiKeyInfo]

  def delete(apiKey: String): Future[Boolean]

  def list(organizationId: Long): Future[Seq[ApiKeyInfo]]
}

case class SSDBApiKeyRepository(client: SSDB) extends ApiKeyRepository {

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global

  private val apiKeyDataset = SsdbKVS[String, ApiKeyInfo](s"di.api_key_dataset", client)

  override def add(apiKeyInfo: ApiKeyInfo): Future[Boolean] = {

    val orgApiKeySet = SsdbSortedSet(orgApiKeySetKey(apiKeyInfo.organizationId), client)
    for {
      addOK <- apiKeyDataset.add(apiKeyInfo.apiKey, apiKeyInfo).asTwitter
      addOrgDbOK <- orgApiKeySet.add(apiKeyInfo.apiKey, System.currentTimeMillis()).asTwitter
    } yield addOK && addOrgDbOK
  }

  override def get(apiKey: String): Future[ApiKeyInfo] = {
    apiKeyDataset
      .get(apiKey)
      .map {
        case Some(apiKeyInfo) => apiKeyInfo
        case None             => throw NotFoundError(s"No api key for $apiKey")
      }
      .asTwitter
  }

  override def list(organizationId: Long): Future[Seq[ApiKeyInfo]] = {
    getApiKeys(organizationId).flatMap(multiGet)
  }

  def multiGet(keys: Seq[String]): Future[Seq[ApiKeyInfo]] = {
    apiKeyDataset
      .multiGet(keys.toArray)
      .map(_.getOrElse(Map.empty))
      .map {
        case dbMap =>
          keys.map(dbMap.get(_)).filter(_.isDefined).map(_.get)
      }
      .asTwitter
  }

  private def getApiKeys(organizationId: Long): Future[Seq[String]] = {
    val orgApiKeySet = SsdbSortedSet(orgApiKeySetKey(organizationId), client)
    orgApiKeySet
      .size()
      .map(_.getOrElse(0))
      .flatMap(orgApiKeySet.range(0, _, true))
      .map(_.getOrElse(Array.empty).map(_._1).toSeq)
      .asTwitter
  }

  override def delete(apiKey: String): Future[Boolean] = {
    apiKeyDataset
      .get(apiKey)
      .asTwitter
      .flatMap {
        case Some(apiKeyInfo) => removeApiKey(apiKeyInfo.organizationId, apiKey)
        case None             => Future.True
      }
  }

  private def removeApiKey(organizationId: Long, apiKey: String): Future[Boolean] = {
    val orgApiKeySet = SsdbSortedSet(orgApiKeySetKey(organizationId), client)
    for {
      _ <- apiKeyDataset.remove(apiKey).asTwitter
      _ <- orgApiKeySet.remove(apiKey).asTwitter
    } yield true
  }

  private def orgApiKeySetKey(organizationId: Long) = s"di.$organizationId.api_keys"

}

package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class ShopifySource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    apiUrl: String,
    accessToken: String,
    apiVersion: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopify

  override def getConfig: Map[String, Any] =
    Map("api_url" -> apiUrl, "access_token" -> accessToken, "api_version" -> apiVersion)

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

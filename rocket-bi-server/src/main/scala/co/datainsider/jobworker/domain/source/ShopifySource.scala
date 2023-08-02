package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.util.ShopifyUtils
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class ShopifySource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    apiUrl: String,
    accessToken: String,
    apiVersion: String
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopify

  override def getConfig: Map[String, Any] = Map()

  def getAdminUrl(): String = ShopifyUtils.getAdminUrl(apiUrl)
}

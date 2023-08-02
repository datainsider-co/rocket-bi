package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import co.datainsider.jobscheduler.util.JsonUtils

case class ShopeeSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    accessToken: String,
    refreshToken: String,
    shopIds: Set[String],
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopee

  override def getConfig: Map[String, Any] =
    Map("shop_ids" -> JsonUtils.toJson(shopIds, false), "access_token" -> accessToken, "refresh_token" -> refreshToken)

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

/**
  * created 2023-04-04 5:44 PM
  *
  * @author tvc12 - Thien Vi
  */
case class ShopeeSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String,
    lastModify: Long,
    accessToken: String,
    refreshToken: String,
    shopIds: Set[String]
) extends DataSource {
  override def getId: SourceId = orgId

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Shopee

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken,
      "refresh_token" -> refreshToken,
      "shop_ids" -> shopIds
    )
}

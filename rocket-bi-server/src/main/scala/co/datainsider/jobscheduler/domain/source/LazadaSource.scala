package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class LazadaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    accessToken: String,
    refreshToken: String,
    expiresInSec: Int,
    refreshExpiresIn: Int,
    country: String,
    accountId: String,
    account: String,
    accountPlatform: String,
    countryUserInfo: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Lazada

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken,
      "refresh_token" -> refreshToken,
      "expires_in_sec" -> expiresInSec,
      "refresh_expires_in" -> refreshExpiresIn,
      "country" -> country,
      "account_id" -> accountId,
      "account" -> account,
      "account_platform" -> accountPlatform,
      "country_user_info" -> countryUserInfo
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

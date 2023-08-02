package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

/**
  * created 2023-04-04 5:44 PM
  *
  * @author tvc12 - Thien Vi
  */
case class LazadaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String,
    lastModify: Long,
    accessToken: String,
    refreshToken: String,
    expiresInSec: Int,
    refreshExpiresIn: Int,
    country: String,
    accountId: String,
    account: String,
    accountPlatform: String,
    countryUserInfo: String
) extends DataSource {
  override def getId: SourceId = orgId

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
      "user_info_list" -> countryUserInfo
    )
}

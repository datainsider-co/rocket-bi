package co.datainsider.jobworker.service.handlers

import co.datainsider.jobworker.domain.source.GoogleAdsSource
import co.datainsider.jobworker.service.handler.GoogleAdsMetaDataHandler
import com.twitter.inject.Test
import com.twitter.util.Await
import co.datainsider.bi.util.ZConfig

class GoogleAdsMetadataHandleTest extends Test {

  val googleSource =
    GoogleAdsSource(
      orgId = -1,
      id = -1,
      displayName = "test",
      creatorId = "-1",
      lastModify = -1,
      refreshToken =
        "1//04FE9U0ztiGiGCgYIARAAGAQSNwF-L9IrxOHc_czyT6VC58ocJ4Ga74ZhRawI3kUaS3uyOhmBr-vgRrasE8VXCYmL_vCGX_HLRxo"
    )

  val handler = new GoogleAdsMetaDataHandler(
    source = googleSource,
    clientId = ZConfig.getString("google_ads_api.gg_client_id"),
    clientSecret = ZConfig.getString("google_ads_api.gg_client_secret"),
    serverEncodedUrl = ZConfig.getString("google_ads_api.server_encoded_url"),
    developerToken = ZConfig.getString("google_ads_api.developer_token")
  )

  test("test get list databases") {

    val dbNames = Await.result(handler.listDatabases())
    println(dbNames)
  }

  test("test connection") {
    assert(Await.result(handler.testConnection()))
  }

  test("test connection with wrong refresh token") {
    val handler = new GoogleAdsMetaDataHandler(
      source = googleSource.copy(refreshToken = "wrong_refresh_token"),
      clientId = ZConfig.getString("google_ads_api.gg_client_id"),
      clientSecret = ZConfig.getString("google_ads_api.gg_client_secret"),
      serverEncodedUrl = ZConfig.getString("google_ads_api.server_encoded_url"),
      developerToken = ZConfig.getString("google_ads_api.developer_token")
    )
    assertFailedFuture[Throwable](handler.testConnection())
  }

}

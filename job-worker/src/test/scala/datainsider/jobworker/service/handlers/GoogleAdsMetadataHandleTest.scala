package datainsider.jobworker.service.handlers

import com.twitter.util.Await
import datainsider.client.util.ZConfig
import datainsider.jobworker.domain.GoogleAdsSource
import datainsider.jobworker.service.handler.GoogleAdsMetaDataHandler
import org.scalatest.FunSuite

class GoogleAdsMetadataHandleTest extends FunSuite {

  val googleSource =
    GoogleAdsSource(
      orgId = -1,
      id = -1,
      displayName = "test",
      creatorId = "-1",
      lastModify = -1,
      refreshToken =
        "1//04UWK7hQ2vzMWCgYIARAAGAQSNwF-L9Irg_PzouNCK86Q3bz-2JdtqhuX74xgDUjzAIN28pj3401QZxZXyhHyU4fMUfY11A6S_aY"
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
    assert(!Await.result(handler.testConnection()))
  }

}

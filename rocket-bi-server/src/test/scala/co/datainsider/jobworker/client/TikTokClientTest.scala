package co.datainsider.jobworker.client

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.repository.reader.tiktok.{TikTokAdsData, TikTokClient, TikTokResponse}
import com.twitter.inject.Test

class TikTokClientTest extends Test {
  val accessToken = "5fb2ed14eddfdb03c340584c7c11233435a25c3c"
  val client = new TikTokClient(baseUrl = ZConfig.getString("tiktok_ads.base_url"), accessToken = accessToken)
  val params: Map[String, String] = Map("advertiser_id" -> "7174349799003717633")

  test("test tiktok client") {
    val response = client.get[TikTokResponse[TikTokAdsData]](endPoint = "campaign/get", params = params.toSeq)
    assert(response.code == 40105)
  }
}

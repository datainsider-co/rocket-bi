package datainsider.jobworker.client

import datainsider.jobworker.repository.reader.tiktok.{TikTokAdsData, TikTokClient, TikTokResponse}
import datainsider.jobworker.util.ZConfig
import org.scalatest.FunSuite

class TikTokClientTest extends FunSuite {
  val accessToken = "5fb2ed14eddfdb03c340584c7c11233435a25c3c"
  val client = new TikTokClient(baseUrl = ZConfig.getString("tiktok_ads.base_url"), accessToken = accessToken)
  val advertiserIdParam: Map[String, String] = Map("advertiser_id" -> "7174349799003717633")
  test("test tiktok client") {
    val response = client.get[TikTokResponse[TikTokAdsData]](endPoint = "campaign/get", params = advertiserIdParam)
    assert(response.code == 0)
  }
}

package co.datainsider.jobworker.client

import co.datainsider.jobworker.client.shopee.ShopeeClientImpl
import co.datainsider.jobworker.util.HashUtils
import com.twitter.inject.Test

/**
  * created 2023-04-05 11:31 AM
  *
  * @author tvc12 - Thien Vi
  */
class ShopeeClientTest extends Test {
  // sample test data
  protected val TEST_SERVER_ENDPOINT = "https://partner.uat.shopeemobile.com"
  protected val PARTNER_ID = "100421"
  protected val PARTNER_KEY = "f44262e6ef143ca4cff63d3f2a8dabfada3a5581abfbef7a8b52197da4148c9a"
  protected val SHOP_ID = "205753"
  protected val ACCESS_TOKEN = "c09222e3fc40ffb25fc947f738b1abf1"

  test("test hash256 with random text") {
    val hashedText = HashUtils.hashSHA256("key", "The quick brown fox jumps over the lazy dog")
    assert(hashedText == "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8")
  }

  test("get common params get shop info") {
    val client = new ShopeeClientImpl(new HttpClientImpl(TEST_SERVER_ENDPOINT), PARTNER_ID, PARTNER_KEY)
    val params = client.buildCommonParams("/api/v2/shop/get_shop_info", Some(ACCESS_TOKEN), Some(SHOP_ID))
    assert(params.size == 5)
    assert(params("partner_id") == PARTNER_ID)
    assert(params("shop_id") == SHOP_ID)
    assert(params("access_token") == ACCESS_TOKEN)
    assert(params("timestamp").nonEmpty)
    assert(params("sign").nonEmpty)
    val hashedText = HashUtils.hashSHA256(
      PARTNER_KEY,
      s"${PARTNER_ID}/api/v2/shop/get_shop_info${params("timestamp")}${ACCESS_TOKEN}${SHOP_ID}"
    )
    assert(params("sign") == hashedText)
  }
}

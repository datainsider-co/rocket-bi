package co.datainsider.jobworker.client

import co.datainsider.jobworker.client.lazada.LazadaClientImpl
import com.twitter.inject.Test

/**
  * created 2023-04-05 11:31 AM
  *
  * @author tvc12 - Thien Vi
  */
class LazadaClientTest extends Test {
  // sample test data
  protected val TEST_SERVER_ENDPOINT = "https://api.lazada.vn/rest"
  protected val APP_KEY = "123456"
  protected val ACCESS_TOKEN = "test"
  protected val TIMESTAMP = "1517820392000"
  protected val SIGN_METHOD = "sha256"
  protected val ORDER_ID = "1234"
  protected val APP_SECRET = "helloworld"

  val lazadaClient =
    new LazadaClientImpl(new HttpClientImpl(TEST_SERVER_ENDPOINT), APP_KEY, APP_SECRET, Some(ACCESS_TOKEN), None)

  test("test hash256 with random text") {
    val params = Map(
      "app_key" -> APP_KEY,
      "timestamp" -> TIMESTAMP,
      "access_token" -> ACCESS_TOKEN,
      "sign_method" -> SIGN_METHOD,
      "order_id" -> ORDER_ID
    )
    val hashedText = lazadaClient.signRequest(APP_SECRET, "/order/get", params, None)
    assert(hashedText == "4190D32361CFB9581350222F345CB77F3B19F0E31D162316848A2C1FFD5FAB4A")
  }
}

package co.datainsider.jobworker.repository

import co.datainsider.bi.util.ZConfig
import com.fasterxml.jackson.databind.JsonNode
import com.github.dockerjava.zerodep.shaded.org.apache.hc.core5.http.HttpHeaders
import com.twitter.finagle.http.Status
import com.twitter.finatra.validation.constraints.{Max, Min}
import datainsider.client.exception.DIException
import datainsider.client.util.JsonParser
import okhttp3.{Interceptor, OkHttpClient, Request, Response}
import org.apache.http.client.utils.URIBuilder
import org.apache.http.message.BasicNameValuePair

import java.io.IOException
import java.util.Date
import java.util.concurrent.TimeUnit

class CoinMarketCapClientException(message: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = "coin_market_cap_client_exception"

  override def getStatus: Status = Status.InternalServerError
}

case class CoinMarketCapStatus(timestamp: Date, errorCode: Int, errorMessage: String, elapsed: Int, creditCount: Int)

case class CoinMarketCapListResponse[T](
    data: Seq[T],
    status: CoinMarketCapStatus
)

trait CoinMarketCapClient {
  @throws[CoinMarketCapClientException]
  def listLatestCrypto(from: Int, size: Int): CoinMarketCapListResponse[JsonNode]

}

class CoinMarketCapClientImpl(
    apiKey: String,
    endpoint: String = ZConfig.getString("coin_market_cap.host"),
    connectTimeout: Int = 5000,
    readTimeout: Int = 30000
) extends CoinMarketCapClient {
  private lazy val client = buildClient(apiKey, connectTimeout, readTimeout)
  private def buildClient(apiKey: String, connectTimeout: Int, readTimeout: Int): OkHttpClient = {
    val client: OkHttpClient = new OkHttpClient.Builder()
      .connectTimeout(connectTimeout, TimeUnit.MILLISECONDS)
      .readTimeout(readTimeout, TimeUnit.MILLISECONDS)
      .addInterceptor(new Interceptor() {
        override def intercept(chain: Interceptor.Chain): Response = {
          val originalRequest = chain.request
          val request: Request = originalRequest.newBuilder
            .header("X-CMC_PRO_API_KEY", apiKey)
            .header(HttpHeaders.ACCEPT, "application/json")
            .method(originalRequest.method, originalRequest.body)
            .build

          return chain.proceed(request)
        }
      })
      .build()

    return client
  }

  override def listLatestCrypto(@Min(0) from: Int, @Max(1000) size: Int): CoinMarketCapListResponse[JsonNode] = {
    call[CoinMarketCapListResponse[JsonNode]](
      "/v1/cryptocurrency/listings/latest",
      Map("start" -> (from + 1).toString, "limit" -> size.toString)
    )
  }

  @throws[CoinMarketCapClientException]
  private def call[T](path: String, params: Map[String, String])(implicit m: Manifest[T]): T = {
    val nameValuePairs: Seq[BasicNameValuePair] = params.map {
      case (key, value) => new BasicNameValuePair(key, value)
    }.toSeq
    val url = new URIBuilder(endpoint: String)
      .setPath(path)
      .setParameters(nameValuePairs: _*)
      .build()
      .toURL
    val request: Request = new Request.Builder().url(url).build()

    try {
      val response: Response = client.newCall(request).execute
      ensureSuccess(response)
      JsonParser.fromJson[T](response.body.string)
    } catch {
      case ex: IOException => throw new CoinMarketCapClientException(ex.getMessage, ex)
    }
  }

  @throws[CoinMarketCapClientException]
  private def ensureSuccess(response: Response): Unit = {
    if (!response.isSuccessful) {
      throw new CoinMarketCapClientException(s"call api failure, cause ${response.body().string}")
    }
  }
}

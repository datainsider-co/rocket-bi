package datainsider.jobworker.util

import datainsider.client.exception.BadRequestError

import java.net.URL
import scala.util.matching.Regex

object ShopifyUtils {

  val SHOP_REGEX: Regex = "([a-zA-Z0-9][a-zA-Z0-9\\-]*).myshopify.com".r


  /**
   * convert api url to admin api url
   * @throws[IllegalArgumentException] when api url incorrect shopify url format
   */
  @throws[IllegalArgumentException]
  def getAdminUrl(apiUrl: String): String = {
    val subdomain: Option[String] = SHOP_REGEX.findFirstMatchIn(apiUrl).map(matcher => matcher.group(1))
    if (subdomain.isDefined) {
      s"https://${subdomain.get}.myshopify.com/admin"
    } else {
      throw new IllegalArgumentException(s"${apiUrl} invalid shopify url")
    }
  }

  /**
   * validate shop url, with pattern from shopify https://shopify.dev/apps/auth/oauth/getting-started#verify-a-request
   */
  def isShopUrl(url: String): Boolean = {
    SHOP_REGEX.findFirstMatchIn(url).isDefined
  }
}

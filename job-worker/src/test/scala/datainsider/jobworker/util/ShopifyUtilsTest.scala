package datainsider.jobworker.util

import org.scalatest.FunSuite

class ShopifyUtilsTest extends FunSuite{
  test("Get admin api url") {
    val adminUrl = ShopifyUtils.getAdminUrl("dev-datainsider.myshopify.com")
    assert(adminUrl == "https://dev-datainsider.myshopify.com/admin")
  }

  test("Get admin api url with protocol") {
    val adminUrl = ShopifyUtils.getAdminUrl("https://dev-datainsider.myshopify.com")
    assert(adminUrl == "https://dev-datainsider.myshopify.com/admin")
  }

  test("Get admin api url Is admin api") {
    val adminUrl = ShopifyUtils.getAdminUrl("https://dev-datainsider.myshopify.com/admin")
    assert(adminUrl == "https://dev-datainsider.myshopify.com/admin")
  }

  test("Get admin api url with empty string") {
    var adminUrl: String = null
    try {
      val adminUrl = ShopifyUtils.getAdminUrl("")
    } catch {
      case ex: Throwable => // ignore
    }
    assert(adminUrl == null)
  }

  test("Is shopify url with dev-datainsider.myshopify.com") {
    assert(ShopifyUtils.isShopUrl("dev-datainsider.myshopify.com"))
  }

  test("Is shopify url with https://dev-datainsider.myshopify.com") {
    assert(ShopifyUtils.isShopUrl("https://dev-datainsider.myshopify.com"))
  }

  test("Is shopify url with https://dev-datainsider.myshopify.com/") {
    assert(ShopifyUtils.isShopUrl("https://dev-datainsider.myshopify.com/"))
  }

  test("Is shopify url with https://canme.com.myshopify.com/") {
    assert(ShopifyUtils.isShopUrl("https://canme.com.myshopify.com/"))
  }

  test("Is shopify url with https://google.com") {
    assert(!ShopifyUtils.isShopUrl("https://google.com"))
  }

  test("Is shopify url with empty string") {
    assert(!ShopifyUtils.isShopUrl(""))
  }
}

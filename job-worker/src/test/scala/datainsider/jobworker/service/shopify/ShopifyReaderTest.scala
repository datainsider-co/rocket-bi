package datainsider.jobworker.service.shopify

import datainsider.jobworker.repository.reader.shopify.ShopifyReader
import org.scalatest.FunSuite

class ShopifyReaderTest extends FunSuite {
  test("get latest id 100 vs 1") {
    val latestId = ShopifyReader.max("100", "1")
    assert(latestId == "100")
  }

  test("get latest id 10 vs 5") {
    val latestId = ShopifyReader.max("10", "5")
    assert(latestId == "10")
  }

  test("get latest id 10 vs 10") {
    val latestId = ShopifyReader.max("10", "10")
    assert(latestId == "10")
  }

  test("get latest id empty string vs 10") {
    val latestId = ShopifyReader.max("", "10")
    assert(latestId == "10")
  }

  test("get latest id xgz vs asd") {
    val latestId = ShopifyReader.max("xgz", "asd")
    assert(latestId == "asd")
  }
}

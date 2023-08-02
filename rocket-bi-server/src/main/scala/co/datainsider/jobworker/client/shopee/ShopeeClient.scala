package co.datainsider.jobworker.client.shopee

import co.datainsider.jobworker.domain.RangeValue
import com.fasterxml.jackson.databind.JsonNode

trait ShopeeClient {
  def get[T: Manifest](path: String, params: Seq[(String, String)]): ShopeeResponse[T]

  def listAllOrders(timeFromInSec: Long, timeToInSec: Long): Seq[Order]

  def getOrderDetails(orderIds: Set[String]): Seq[JsonNode]

  def listProducts(updateTimeRange: RangeValue[Long], offset: Int): ProductResponse

  def getProductDetails(itemIds: Set[Int]): Seq[JsonNode]

  def listAllCategories(): Seq[JsonNode]

  def getShopPerformance(): JsonNode
}

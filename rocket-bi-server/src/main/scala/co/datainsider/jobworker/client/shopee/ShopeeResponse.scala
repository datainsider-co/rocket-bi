package co.datainsider.jobworker.client.shopee

import com.fasterxml.jackson.databind.JsonNode

case class ShopeeResponse[T](request_id: String, error: String, message: Option[String], response: Option[T])

case class CategoryResponse(
    categoryList: Seq[JsonNode]
)
case class Order(
    orderSn: String,
    orderStatus: String
)
case class OrderListResponse(orderList: Seq[JsonNode])

case class OrderResponse(
    more: Boolean,
    orderList: Seq[Order],
    nextCursor: String
)

case class Product(itemId: Int, itemStatus: String, updateTime: Long)

case class ProductListResponse(itemList: Seq[JsonNode])

case class ProductResponse(
    item: Seq[Product],
    totalCount: Int,
    hasNextPage: Boolean,
    nextOffset: Int
)

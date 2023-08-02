package co.datainsider.jobworker.client.lazada

import com.fasterxml.jackson.databind.JsonNode

/**
  * created 2023-04-12 3:00 PM
  *
  * @author tvc12 - Thien Vi
  */
case class LazadaResponse[T](
    requestId: String,
    code: String,
    data: Option[T] = None,
    result: Option[T] = None,
    `type`: Option[String] = None,
    message: Option[String] = None
) {
  def getData(): Option[T] = data.orElse(result)
}

case class OrderResponse(
    countTotal: Long,
    count: Long,
    orders: Seq[JsonNode]
)

case class OrderItemResponse(
    orderNumber: Long,
    orderId: Long,
    orderItems: Seq[JsonNode]
)

case class ProductListResponse(
    totalProducts: Long,
    products: Seq[JsonNode]
)

case class FlexiComboListResponse(
    pageSize: Long,
    total: Long,
    current: Long,
    dataList: Seq[JsonNode]
)

case class PartnerTransactionListResponse(
    totalCount: Long,
    pageNo: Long,
    pageSize: Long,
    modelList: Seq[JsonNode]
)

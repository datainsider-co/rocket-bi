package co.datainsider.jobworker.client.lazada

import co.datainsider.jobworker.client.HttpClient
import co.datainsider.jobworker.domain.RangeValue
import co.datainsider.jobworker.util.HashUtils
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

import scala.annotation.tailrec

/**
  * created 2023-04-12 2:50 PM
  *
  * @author tvc12 - Thien Vi
  */
trait LazadaClient {

  /**
    * get orders and return order response to client
    * orders will be sorted by updated time in ascending order
    */
  def getOrders(updatedTimeRange: RangeValue[String], offset: Long = 0): OrderResponse

  /**
    * get order items by order id and return order item response to client
    */
  def getOrderItems(orderIds: Set[String]): Seq[OrderItemResponse]

  /**
   * get products from start date to end date with offset
   */
  def getProducts(syncRangeValue: RangeValue[String], offset: Long): ProductListResponse

  def getFlexiComboList(page: Long): FlexiComboListResponse

  /**
   * get payout status list
   * @param createdAfter - format date: yyyy-MM-dd
   * @return
   */
  def getPayoutStatusList(createdAfter: String): Seq[JsonNode]

  def getTransactionDetails(syncRangeValue: RangeValue[String], offset: Long): Seq[JsonNode]

  /**
   * get partner transaction detail
   */
  def getPartnerTransactions(syncRangeValue: RangeValue[String], offset: Long): PartnerTransactionListResponse
}

class LazadaClientImpl(
    client: HttpClient,
    appKey: String,
    appSecret: String,
    accessToken: Option[String] = None,
    refreshToken: Option[String] = None,
    sleepTimeMs: Long = 5000,
    maxRetry: Int = 3
) extends LazadaClient
    with Logging {
  private val MAX_ORDER_SIZE = "100"
  private val DEFAULT_ITEM_SIZE = "100"
  private val DEFAULT_SORT_DIRECTION = "ASC"
  private val MAX_ORDER_ITEMS_PER_REQUEST = 50
  private val MAX_PRODUCT_PER_REQUEST = "50"
  private val MAX_TRANSACTION_PER_REQUEST = "500"
  def get[T: Manifest](path: String, params: Map[String, String] = Map.empty): LazadaResponse[T] = {
    val finalParams: Map[String, String] = buildRequestParams(path, params)
    client.get[LazadaResponse[T]](path, Seq.empty, finalParams.toSeq)
  }

  private def buildRequestParams(path: String, baseParams: Map[String, String] = Map.empty): Map[String, String] = {
    val commonParams = Map(
      "app_key" -> appKey,
      "timestamp" -> String.valueOf(System.currentTimeMillis()),
      "access_token" -> accessToken.getOrElse(""),
      "sign_method" -> "sha256"
    )
    val allParams = (baseParams ++ commonParams).filter(_._2.nonEmpty)
    val sign = signRequest(appSecret, path, allParams)
    allParams + ("sign" -> sign)
  }

  /**
    * sign request by algorithm provided by lazada
    * https://open.lazada.com/apps/doc/doc?nodeId=10450&docId=108068
    * sample algorithm: https://open.lazada.com/apps/doc/doc?nodeId=10451&docId=108069
    */
  @throws[InternalError]("when sign request failed")
  def signRequest(appSecret: String, path: String, params: Map[String, String], body: Option[String] = None): String = {
    // first: sort all text parameters
    val sortedKeys: Seq[String] = params.keys.toSeq.sorted

    // second: connect all text parameters with key and value
    val query: StringBuilder = new StringBuilder()
    query.append(path)
    sortedKeys.foreach { key =>
      val value = params(key)
      if (key.nonEmpty && value.nonEmpty) {
        query.append(key).append(value)
      }
    }
    // third：put the body to the end
    if (body.isDefined) {
      query.append(body.get)
    }
    val hashedText: String = HashUtils.hashSHA256(appSecret, query.toString).toUpperCase
    hashedText
  }

  override def getOrders(updatedTimeRange: RangeValue[String], offset: Long): OrderResponse = {
    val params = Map(
      "update_after" -> updatedTimeRange.from,
      "update_before" -> updatedTimeRange.to,
      "offset" -> String.valueOf(offset),
      "sort_by" -> "updated_at",
      "sort_direction" -> DEFAULT_SORT_DIRECTION,
      "limit" -> MAX_ORDER_SIZE
    )
    val orderResponse: OrderResponse = executeWithRetry(() => get[OrderResponse]("/orders/get", params))
    orderResponse
  }

  @tailrec
  private def executeWithRetry[T](fn: () => LazadaResponse[T], retry: Int = 0): T = {
    try {
      val response = fn()
      ensureSuccess(response)
      response.getData().get
    } catch {
      case ex: Exception =>
        logger.error(s"Retry $retry times, but still failed", ex)
        if (retry > maxRetry) {
          Thread.sleep(sleepTimeMs)
          executeWithRetry(fn, retry + 1)
        } else {
          throw InternalError(
            s"Request to lazada failed, please check log for more details, latest error: ${ex.getMessage}"
          )
        }
    }
  }

  private def ensureSuccess[T](response: LazadaResponse[T]): Unit = {
    if (response.code != "0") {
      throw InternalError(
        s"Request failed with code ${response.code}, message ${response.message.getOrElse("")}, type ${response.`type`.getOrElse("")}"
      )
    }
  }

  override def getOrderItems(orderIds: Set[String]): Seq[OrderItemResponse] = {
    orderIds
      .grouped(MAX_ORDER_ITEMS_PER_REQUEST)
      .flatMap { ids =>
        val params = Map(
          "order_ids" -> ids.mkString(",")
        )
        executeWithRetry(() => get[Seq[OrderItemResponse]]("/orders/items/get", params))
      }
      .toSeq
  }

  override def getProducts(syncRangeValue: RangeValue[String], offset: Long): ProductListResponse = {
    val params = Map(
      "update_before" -> syncRangeValue.to,
      "update_after" -> syncRangeValue.from,
      "offset" -> String.valueOf(offset),
      "limit" -> MAX_PRODUCT_PER_REQUEST
    )
    executeWithRetry(() => get[ProductListResponse]("/products/get", params))
  }

  override def getFlexiComboList(page: Long): FlexiComboListResponse = {
    val params = Map(
      "cur_page"-> String.valueOf(page),
      "page_size"-> DEFAULT_ITEM_SIZE
    )
    executeWithRetry(() => get[FlexiComboListResponse]("/promotion/flexicombo/list", params))
  }

  override def getPayoutStatusList(createdAfter: String): Seq[JsonNode] = {
    val params = Map(
      "created_after" -> createdAfter
    )
    executeWithRetry(() => get[Seq[JsonNode]]("/finance/payout/status/get", params))
  }

  override def getTransactionDetails(syncRangeValue: RangeValue[String], offset: Long): Seq[JsonNode] = {
    val params = Map(
      "start_time" -> syncRangeValue.from,
      "end_time" -> syncRangeValue.to,
      "offset" -> String.valueOf(offset),
      "limit" -> MAX_TRANSACTION_PER_REQUEST
    )
    executeWithRetry(() => get[Seq[JsonNode]]("/finance/transaction/details/get", params))
  }

  /**
   * get partner transaction detail
   */
  override def getPartnerTransactions(syncRangeValue: RangeValue[String], offset: Long): PartnerTransactionListResponse = {
    val params = Map(
      "update_after" -> syncRangeValue.from,
      "update_before" -> syncRangeValue.to,
      "offset" -> String.valueOf(offset),
      "limit" -> DEFAULT_ITEM_SIZE,
      "sort_by" -> "updated_at",
    )
    executeWithRetry(() => get[PartnerTransactionListResponse]("/partner/transaction", params))
  }
}

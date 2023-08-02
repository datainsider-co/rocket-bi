package co.datainsider.jobworker.client.shopee

import co.datainsider.jobworker.client.HttpClient
import co.datainsider.jobworker.domain.RangeValue
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

import scala.annotation.tailrec
import scala.collection.mutable.ArrayBuffer
import scala.util.control.Breaks.{break, breakable}

/**
  * created 2023-04-05 10:29 AM
  * @author tvc12 - Thien Vi
  */
class ShopeeClientImpl(
    client: HttpClient,
    partnerId: String,
    partnerKey: String,
    accessToken: Option[String] = None,
    shopId: Option[String] = None,
    maxRetryTime: Int = 3,
    sleepTimeMs: Int = 5000
) extends ShopeeClient
    with Logging {

  private val MAX_PAGE_SIZE = 100
  private val MAX_LIST_SIZE = 50

  def buildCommonParams(
      path: String,
      accessToken: Option[String] = None,
      shopId: Option[String] = None
  ): Map[String, String] = {
    // divide by 1000 to get second, not millisecond https://open.shopee.com/developer-guide/20
    val timestamp: Long = System.currentTimeMillis() / 1000
    val sign = ShopeeClientUtils.hashSHA256(partnerKey, partnerId, path, timestamp, accessToken, shopId)
    val commonParams: Map[String, String] = Map(
      "partner_id" -> partnerId,
      "shop_id" -> shopId.getOrElse(""),
      "access_token" -> accessToken.getOrElse(""),
      "timestamp" -> String.valueOf(timestamp),
      "sign" -> sign
    ).filter(_._2.nonEmpty)
    commonParams
  }

  def get[T: Manifest](path: String, params: Seq[(String, String)]): ShopeeResponse[T] = {
    val accessToken: Option[String] = this.accessToken
    val shopId: Option[String] = this.shopId
    val finalParams: Seq[(String, String)] = buildCommonParams(path, accessToken, shopId).toSeq ++ params
    client.get[ShopeeResponse[T]](path, Seq.empty, finalParams)
  }

  def listAllOrders(timeFromInSec: Long, timeToInSec: Long): Seq[Order] = {
    val orders = ArrayBuffer.empty[Order]
    var cursor: Option[String] = None
    while (true) {
      breakable {
        val shopeeResponse: ShopeeResponse[OrderResponse] = executeWithRetry(() => {
          val params: Map[String, String] = Map(
            "time_range_field" -> "updated_time",
            "time_from" -> String.valueOf(timeFromInSec),
            "time_to" -> String.valueOf(timeToInSec),
            "cursor" -> cursor.getOrElse(""),
            "page_size" -> String.valueOf(MAX_PAGE_SIZE)
          )
          get[OrderResponse]("/api/v2/order/get_order_list", params.toSeq)
        })
        orders.appendAll(shopeeResponse.response.get.orderList)
        if (!shopeeResponse.response.get.more) {
          break
        } else {
          cursor = Option(shopeeResponse.response.get.nextCursor)
        }
      }
    }
    orders
  }

  def getOrderDetails(orderIds: Set[String]): Seq[JsonNode] = {
    orderIds
      .grouped(MAX_LIST_SIZE)
      .flatMap(ids => {
        val response = executeWithRetry(() => {
          val params: Map[String, String] = buildGetOrderDetailParams(ids)
          get[OrderListResponse]("/api/v2/order/get_order_detail", params.toSeq)
        })
        response.response.get.orderList
      })
      .toSeq
  }

  private def buildGetOrderDetailParams(orderIds: Set[String]): Map[String, String] = {
    Map("order_sn_list" -> orderIds.mkString(","), "response_optional_fields" -> "")
  }

  @tailrec
  private def executeWithRetry[T](fn: () => ShopeeResponse[T], retryTime: Int = 0): ShopeeResponse[T] = {
    try {
      val apiResponse: ShopeeResponse[T] = fn()
      ensureSuccess(apiResponse)
      apiResponse
    } catch {
      case ex: Throwable => {
        logger.error(s"Cannot execute api, sleep", ex)
        if (retryTime < maxRetryTime) {
          Thread.sleep(sleepTimeMs)
          executeWithRetry(fn, retryTime + 1)
        } else {
          throw InternalError(s"Retry execute api failed, last error message: ${ex.getMessage}", ex)
        }
      }
    }
  }

  private def ensureSuccess[T](response: ShopeeResponse[T]): Unit = {
    if (response.error.nonEmpty) {
      throw InternalError(
        s"Shopee response is not success, code: ${response.error}, error message: ${response.message.getOrElse("unknown error")}"
      )
    }
    if (response.response.isEmpty) {
      throw InternalError(s"Shopee response is not success, response is empty")
    }
  }

  override def listProducts(updateTimeRange: RangeValue[Long], offset: Int): ProductResponse = {
    val params: Seq[(String, String)] = Seq(
      "offset" -> String.valueOf(offset),
      "page_size" -> String.valueOf(MAX_PAGE_SIZE),
      "update_time_from" -> String.valueOf(updateTimeRange.from),
      "update_time_to" -> String.valueOf(updateTimeRange.to),
      "item_status" -> "NORMAL",
      "item_status" -> "BANNED",
      "item_status" -> "DELETED",
      "item_status" -> "UNLIST"
    )
    val response = executeWithRetry(() => get[ProductResponse]("/api/v2/product/get_item_list", params))
    response.response.get
  }

  override def getProductDetails(itemIds: Set[Int]): Seq[JsonNode] = {
    itemIds
      .grouped(MAX_LIST_SIZE)
      .flatMap(ids => {
        val response = executeWithRetry(() => {
          val params: Map[String, String] = Map("item_id_list" -> ids.mkString(","))
          get[ProductListResponse]("/api/v2/product/get_item_base_info", params.toSeq)
        })
        response.response.get.itemList
      })
      .toSeq
  }

  override def listAllCategories(): Seq[JsonNode] = {
    val response = executeWithRetry(() => get[CategoryResponse]("/api/v2/category/get_category_list", Seq.empty))
    response.response.get.categoryList
  }

  override def getShopPerformance(): JsonNode = {
    null
  }
}

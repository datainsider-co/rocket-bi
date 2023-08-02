package co.datainsider.jobworker.client.shopee

import co.datainsider.jobworker.domain.RangeValue
import co.datainsider.jobworker.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode

/**
  * created 2023-04-07 6:28 PM
 *
  * @author tvc12 - Thien Vi
  */
class MockShopeeClient extends ShopeeClient {
  override def get[T: Manifest](path: String, params: Seq[(String, String)]): ShopeeResponse[T] = {
    val response = ShopeeResponse[T](
      request_id = "request_id",
      error = "fake_api",
      message = None,
      response = None
    )
    response
  }

  override def listAllOrders(timeFromInSec: Long, timeToInSec: Long): Seq[Order] =
    Seq(
      Order("1", "success"),
      Order("2", "success"),
      Order("3", "success"),
      Order("4", "success")
    )

  override def getOrderDetails(orderIds: Set[String]): Seq[JsonNode] = {
    val json = """[{"checkout_shipping_carrier":null,"actual_shipping_fee ":null,"actual_shipping_fee_confirmed":false,"buyer_cancel_reason":"","buyer_cpf_id":null,"buyer_user_id":258065,"buyer_username":"drcbuy_uat_sg_1","cancel_by":"","cancel_reason":"","cod":false,"create_time":1632973421,"currency":"SGD","days_to_ship":3,"dropshipper":"","dropshipper_phone":"","estimated_shipping_fee":3.99,"fulfillment_flag":"fulfilled_by_local_seller","goods_to_declare":false,"invoice_data":null,"item_list":[{"item_id":101513055,"item_name":"Vitamin Bottles - Acc","item_sku":"","model_id":0,"model_name":"","model_sku":"","model_quantity_purchased":1,"model_original_price":3000,"model_discounted_price":3000,"wholesale":false,"weight":0.3,"add_on_deal":false,"main_item":false,"add_on_deal_id":0,"promotion_type":"","promotion_id":0,"order_item_id":101513055,"promotion_group_id":0,"image_info":{"image_url":"https://cf.shopee.sg/file/fe05b113170c5e97ed515cf0f2fb9c0e_tn"},"product_location_id":["IDL","IDG"]}],"message_to_seller":"","note":"","note_update_time":0,"order_sn":"210930KJDNF06T","order_status":"COMPLETED","package_list":[{"package_number":"OFG86672620092786","logistics_status":"LOGISTICS_DELIVERY_DONE","shipping_carrier":"Singpost POPstation - LPS (seller)","item_list":[{"item_id":101513055,"model_id":0,"model_quantity":1}]}],"pay_time":1632973437,"payment_method":"Credit/Debit Card","pickup_done_time":1632973711,"recipient_address":{"name":"Buyer","phone":"******10","town":"","district":"","city":"","state":"","region":"SG","zipcode":"820116","full_address":"BLOCK 116, EDGEFIELD PLAINS, #05-334, SG, 820116"},"region":"SG","reverse_shipping_fee":0,"ship_by_date":1633405439,"shipping_carrier":"Singpost POPstation - LPS (seller)","split_up":false,"total_amount":2988.99,"update_time":1633001809}]"""
    val data = JsonUtils.fromJson[Seq[JsonNode]](json)
    data
  }

  override def listProducts(updateTimeRange: RangeValue[Long], offset: Int): ProductResponse = {
    ProductResponse(Seq.empty, 0, false, 1)
  }

  override def getProductDetails(itemIds: Set[Int]): Seq[JsonNode] = {
    val json = """[{"item_id":3400133011,"category_id":14646,"item_name":"seller discount ongoing","item_sku":"","create_time":1600572637,"update_time":1608129425,"attribute_list":[{"attribute_id":4811,"original_attribute_name":"Brand: L2 Default [14644]","is_mandatory":false,"attribute_value_list":[{"value_id":0,"original_value_name":"","value_unit":""}]}],"price_info":[{"currency":"SGD","original_price":100,"current_price":50}],"stock_info_v2":{"summary_info":{"total_reserved_stock":0,"total_available_stock":223},"seller_stock":[{"location_id":"TWZ","stock":223}]},"image":{"image_url_list":["https://cf.shopee.sg/file/1e076dff0699d8e778c06dd6c02df1fe","https://cf.shopee.sg/file/c07ac95ba7bb624d731e37fe2f0349de"],"image_id_list":["1e076dff0699d8e778c06dd6c02df1fe","c07ac95ba7bb624d731e37fe2f0349de"]},"weight":"1.000","dimension":{"package_length":0,"package_width":0,"package_height":0},"logistic_info":[{"logistic_id":233,"logistic_name":"233","enabled":false,"shipping_fee":0,"is_free":false},{"logistic_id":19103,"logistic_name":"Singpost - Popstation","enabled":false,"shipping_fee":0,"is_free":false},{"logistic_id":10007,"logistic_name":"Ninja Van","enabled":false,"is_free":false,"estimated_shipping_fee":1.49},{"logistic_id":19107,"logistic_name":"Simply Post","enabled":false,"shipping_fee":0,"is_free":false},{"logistic_id":13002,"logistic_name":"shuming test","enabled":false,"shipping_fee":0,"is_free":false},{"logistic_id":234,"logistic_name":"dnt","enabled":true,"shipping_fee":0,"is_free":true},{"logistic_id":19900,"logistic_name":"Other Logistics Provider","enabled":false,"shipping_fee":0,"is_free":false},{"logistic_id":10101,"logistic_name":"SG_TEST_CHANNEL_JNT","enabled":false,"is_free":false,"estimated_shipping_fee":0}],"pre_order":{"is_pre_order":false,"days_to_ship":2},"condition":"NEW","size_chart":"","item_status":"NORMAL","has_model":false,"promotion_id":1000030380,"brand":{"brand_id":123,"original_brand_name":"nike"},"tax_info":{"ncm":123,"same_state_cfop":123,"diff_state_cfop":123,"csosn":123,"origin":1},"description_type":"extended","description_info":{"extended_description":{"field_list":[{"field_type":"text","text":"text description 1"},{"field_type":"text","image_info":{"image_id":"1e076dff0699d8e778c06dd6c02df1fe","image_url":"https://cf.shopee.sg/file/1e076dff0699d8e778c06dd6c02df1fe"}},{"field_type":"text","image_info":{"image_id":"c07ac95ba7bb624d731e37fe2f0349de","image_url":"https://cf.shopee.sg/file/c07ac95ba7bb624d731e37fe2f0349de"}},{"field_type":"text","text":"text description 1"}]}}}]"""
    val data = JsonUtils.fromJson[Seq[JsonNode]](json)
    data
  }

  override def listAllCategories(): Seq[JsonNode] = {
    val json = """[{
                 |"category_id": 123,
                 |"parent_category_id": 456,
                 |"original_category_name": "aaa",
                 |"display_category_name": "bbb",
                 |"has_children": false
                 |}]""".stripMargin
    val data = JsonUtils.fromJson[Seq[JsonNode]](json)
    data
  }

  override def getShopPerformance(): JsonNode = {
    null
  }
}

package co.datainsider.jobworker.client.palexy
import co.datainsider.jobworker.util.JsonUtils

import java.sql.Date

/**
  * created 2023-07-11 3:17 PM
  * @author tvc12 - Thien Vi
  */
class MockPalexyClient extends PalexyClient {

  override def getStoreReport(
      apiKey: String,
      metrics: Set[String],
      dimensions: Set[String],
      fromDate: Date,
      toDate: Date,
      storeCodes: Set[String],
      storeIds: Set[String]
  ): PalexyResponse = {
    val responseText =
      """{"total_elements":0,"rows":[{"store_id":"581","store_code":"103","visits":"180","average_dwell_time":"627","store_name":"Boutique - 1","walk_ins":"180","day":"2023-07-01"},{"store_id":"593","store_code":"303","visits":"31","average_dwell_time":"1408","store_name":"Boutique - 2","walk_ins":"31","day":"2023-07-01"},{"store_id":"595","store_code":"302","visits":"8","average_dwell_time":"2399","store_name":"Boutique - 3","walk_ins":"8","day":"2023-07-01"},{"store_id":"596","store_code":"104","visits":"202","average_dwell_time":"480","store_name":"Boutique - 4","walk_ins":"202","day":"2023-07-01"},{"store_id":"733","store_code":"403","visits":"10","average_dwell_time":"3851","store_name":"Boutique - 5","walk_ins":"10","day":"2023-07-01"},{"store_id":"734","store_code":"308","visits":"5","average_dwell_time":"1501","store_name":"Boutique - 6","walk_ins":"5","day":"2023-07-01"},{"store_id":"735","store_code":"310","visits":"9","average_dwell_time":"573","store_name":"Boutique - 7","walk_ins":"9","day":"2023-07-01"},{"store_id":"736","store_code":"106","visits":"59","average_dwell_time":"1002","store_name":"Boutique - 8","walk_ins":"59","day":"2023-07-01"},{"store_id":"737","store_code":"107","visits":"35","average_dwell_time":"1106","store_name":"Boutique - 9","walk_ins":"35","day":"2023-07-01"},{"store_id":"738","store_code":"304","visits":"4","average_dwell_time":"883","store_name":"Boutique - 10","walk_ins":"4","day":"2023-07-01"},{"store_id":"739","store_code":"309","visits":"22","average_dwell_time":"1350","store_name":"Boutique - 11","walk_ins":"22","day":"2023-07-01"}]}"""
    JsonUtils.fromJson[PalexyResponse](responseText)
  }
}

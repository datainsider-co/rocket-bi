package co.datainsider.jobworker.client.palexy
import co.datainsider.jobworker.client.HttpClient

import java.sql.Date

/**
  * created 2023-07-10 5:52 PM
  * @author tvc12 - Thien Vi
  */
class PalexyClientImpl(httpClient: HttpClient) extends PalexyClient {
  override def getStoreReport(
       apiKey: String,
      metrics: Set[String],
      dimensions: Set[String],
      fromDate: Date,
      toDate: Date,
      storeCodes: Set[String],
      storeIds: Set[String]
  ): PalexyResponse = {
    val params = Seq(
      "api_key" -> apiKey,
        "metrics" -> metrics.mkString(","),
        "dimensions" -> dimensions.mkString(","),
        "fromDate" -> fromDate.toString,
        "toDate" -> toDate.toString,
        "storeCodes" -> storeCodes.mkString(","),
        "storeIds" -> storeIds.mkString(",")
    ).filter(_._2.nonEmpty)
    httpClient.get[PalexyResponse]("/api/v2/report/getStoreReport", params = params)
  }
}

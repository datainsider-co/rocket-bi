package co.datainsider.jobworker.client.palexy

import java.sql.Date

/**
  * created 2023-07-10 5:46 PM
  *
  * @author tvc12 - Thien Vi
  */
trait PalexyClient {
  def getStoreReport(
      apiKey: String,
      metrics: Set[String],
      dimensions: Set[String] = Set.empty,
      fromDate: Date,
      toDate: Date,
      storeCodes: Set[String] = Set.empty,
      storeIds: Set[String] = Set.empty
  ): PalexyResponse
}

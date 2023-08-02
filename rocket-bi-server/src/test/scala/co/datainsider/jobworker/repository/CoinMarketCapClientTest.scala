package co.datainsider.jobworker.repository

import co.datainsider.jobworker.service.worker.CoinMarketCapWorker
import co.datainsider.bi.util.ZConfig
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Test

class CoinMarketCapClientTest extends Test {
  val apiKey = ZConfig.getString("test_db.coin_market_cap.api_key")
  var response: CoinMarketCapListResponse[JsonNode] = _

  test("list coin") {
    val client = new CoinMarketCapClientImpl(apiKey)
    response = client.listLatestCrypto(1, 10)
    assert(response != null)
    assert(response.status.errorCode == 0)
    response.data.foreach(node => println(node.toPrettyString))
  }

  test("parse columns") {
    val columns = CoinMarketCapWorker.getCoinTableSchema(1, "", "").columns
    val records = CoinMarketCapWorker.toRecords(columns, response.data, CoinMarketCapWorker.COLUMN_NAME_TO_PATH_MAP)
    println(s"total columns: ${columns.size}")
    println(s"total records: ${records.size}")
    records.foreach(record => println(s"records:: ${record}"))
  }
}

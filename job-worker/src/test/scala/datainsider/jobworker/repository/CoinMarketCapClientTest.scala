package datainsider.jobworker.repository

import com.fasterxml.jackson.databind.JsonNode
import datainsider.jobworker.service.worker.CoinMarketCapWorker
import datainsider.jobworker.util.ZConfig
import org.scalatest.FunSuite

class CoinMarketCapClientTest extends FunSuite{
  val apiKey = ZConfig.getString("database_test.coin_market_cap.api_key")
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

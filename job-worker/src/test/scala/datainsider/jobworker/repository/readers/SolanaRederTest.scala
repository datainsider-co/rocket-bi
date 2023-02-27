package datainsider.jobworker.repository.readers

import datainsider.jobworker.repository.SolanaClientImpl
import datainsider.jobworker.repository.reader.SolanaReaderImpl
import datainsider.jobworker.util.JsonUtils
import org.scalatest.FunSuite;


class SolanaReaderTest extends FunSuite {

  val client = new SolanaClientImpl("https://api.mainnet-beta.solana.com", 3)

  test("test block height") {
    val reader = new SolanaReaderImpl(1, new SolanaClientImpl("https://api.testnet.solana.com", 3), 128857374)

    val lowestSlot = reader.getCurrentSlot()
    val highestSlot = reader.getHighestSlot()

    println(s"test connection, lowestSlot: ${lowestSlot}, highestSlot: ${highestSlot}")

    assert(lowestSlot == 128857374)
    assert(highestSlot >= 128857374)
  }

  test("test get block height") {
    val reader = new SolanaReaderImpl(1, client, 129822707)

    if (reader.hasNext()) {
      reader.next()
      val blockRecord = reader.getBlockRecord()

      println(s"blockRecord records: ${blockRecord}")

      val transactionsRecords = reader.getTransactionRecords()

      println(s"transactions records: ${JsonUtils.toJson(transactionsRecords.head)}")

      val rewardRecords = reader.getRewardRecords()

      println(s"reward records: ${rewardRecords.head}")
    } else {
      assert(false)
    }
  }
}

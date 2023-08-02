package co.datainsider.jobworker.repository.readers.shopee

import co.datainsider.jobworker.client.shopee.MockShopeeClient
import co.datainsider.jobworker.domain.job.{ShopeeJob, ShopeeSupportedTable}
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, RangeValue, SyncMode}
import co.datainsider.jobworker.repository.reader.shopee.OrderShopeeReader
import co.datainsider.bi.util.Using
import com.twitter.inject.Test
import co.datainsider.schema.domain.column._

/**
 * created 2023-04-07 6:25 PM
 *
 * @author tvc12 - Thien Vi
 */
class ShopeeReaderTest extends Test {
  val client = new MockShopeeClient()
  val timeRange = RangeValue(from = getNDaysAgoMillis(7) / 1000, to = System.currentTimeMillis() / 1000)
  val baseJob =  new ShopeeJob(
    orgId = 1,
    jobId = 1,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 1,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 1,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Error,
    tableName = ShopeeSupportedTable.Order,
    destDatabaseName = "tvc12",
    destTableName = "order",
    destinations = Seq(DataDestination.Clickhouse),
    shopId = "fake-id",
    timeRange = timeRange,
    incrementalColumn = Some("update_time"),
    lastSyncedValue = None
  )
  test("init reader must success") {
    val reader = new OrderShopeeReader(client, baseJob, syncTimestampRange = timeRange)
    assert(reader != null)
    assert(reader.hasNext)
    assert(reader.columns.nonEmpty)
    assert(reader.isIncrementalMode())
    assert(reader.lastSyncedValue.nonEmpty)
  }

  test("read data must success") {
    Using(new OrderShopeeReader(client, baseJob, syncTimestampRange = timeRange)) {
      reader => {
        val records = reader.next(reader.columns)
        assert(records.nonEmpty)
        assert(records.size == 1)
        assert(reader.columns.nonEmpty)
        assert(reader.isIncrementalMode())
        assert(reader.lastSyncedValue.nonEmpty)
        println("start last sync value: " + reader.lastSyncedValue)
        reader.columns.zipWithIndex.foreach { case (column, index) =>
          val value = records(0)(index)
          if (value != null) {
            column match {
              case _: StringColumn => assert(value.isInstanceOf[String])
              case _: Int8Column => assert(value.isInstanceOf[Int])
              case _: Int16Column => assert(value.isInstanceOf[Int])
              case _: Int32Column => assert(value.isInstanceOf[Int])
              case _: Int64Column => assert(value.isInstanceOf[Long])
              case _: FloatColumn => assert(value.isInstanceOf[Float])
              case _: DoubleColumn => assert(value.isInstanceOf[Double])
              case _: BoolColumn => assert(value.isInstanceOf[Boolean])
              case _ => println(s"not support type ${column.getClass.getName}")
            }
          }
        }
        println("end last sync value: " + reader.lastSyncedValue)
      }
    }

  }


  private def getNDaysAgoMillis(nDays: Int): Long = {
    val now = System.currentTimeMillis()
    val nDaysAgo = now - nDays * 24 * 60 * 60 * 1000
    nDaysAgo
  }
}

package co.datainsider.jobworker.repository.readers.lazada

import co.datainsider.jobworker.client.lazada.MockLazadaClient
import co.datainsider.jobworker.domain.job.{LazadaJob, LazadaSupportedTable}
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, RangeValue, SyncMode}
import co.datainsider.jobworker.repository.reader.lazada.TransactionDetailLazadaReader
import co.datainsider.bi.util.Using

/**
  * created 2023-04-07 6:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class TransactionDetailLazadaReaderTest extends AbstractShopeeReaderTest {
  val client = new MockLazadaClient()
  val timeRange = RangeValue(from = getNDaysAgoAsString(7), to = getNDaysAgoAsString(0))
  val baseJob = new LazadaJob(
    orgId = 1,
    jobId = 1,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 1,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 1,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Error,
    tableName = LazadaSupportedTable.TransactionDetail,
    destDatabaseName = "tvc12",
    destTableName = "order",
    destinations = Seq(DataDestination.Clickhouse),
    timeRange = RangeValue(from = getNDaysAgoAsMillis(7), to = getNDaysAgoAsMillis(0)),
    incrementalColumn = Some("updated_at"),
    lastSyncedValue = None
  )

  test("init reader must success") {
    val reader = new TransactionDetailLazadaReader(client, timeRange, job = baseJob)
    assert(reader != null)
    assert(reader.hasNext)
    assert(reader.columns.nonEmpty)
    assert(reader.isIncrementalMode())
    assert(reader.lastSyncedValue.nonEmpty)
  }

  test("read data must success") {
    Using(new TransactionDetailLazadaReader(client, timeRange, baseJob)) { reader =>
      {
        val records = reader.next(reader.columns)
        assert(records.nonEmpty)
        assert(records.size == 1)
        assert(reader.columns.nonEmpty)
        assert(reader.isIncrementalMode())
        assert(reader.lastSyncedValue.nonEmpty)
        println("start last sync value: " + reader.lastSyncedValue)
        reader.columns.zipWithIndex.foreach {
          case (column, index) =>
            val value = records(0)(index)
            assertValue(value, column)
        }
        println("end last sync value: " + reader.lastSyncedValue)
      }
    }

  }

}
